// Initialize the reminder set
const toRemind = new Set();

// Reminder delays 
const reminderDelays = [
  30 * 60 * 1000,    // 30 minutes
  15 * 60 * 1000,   // 15 minutes
  5 * 60 * 1000,    // 5 minutes
  60 * 1000,        // 1 minute
  30 * 1000,        // 30 second
  3 * 1000        // 3 seconds
];

// This function will handle the reminder loop for each task
function checkAndRemind(taskId, priority) {
  if (!toRemind.has(taskId)) {
    console.log(`Task ${taskId} is no longer in the reminder set. Stopping reminders.`);
    return;
  }

  console.log(`Reminder for task ${taskId} triggered.`);
  chrome.runtime.sendMessage({
    action: "focus-tab",
    reason: 'Mah shrigga shlakin on ${taskId}',
  })
  chrome.runtime.sendMessage({
    action: "show-notification",
    taskId,
    priority
  });

  const delay = reminderDelays[priority];

  setTimeout(() => checkAndRemind(taskId, priority), delay);
}

function startReminder(taskId, priority) {
  if (!toRemind.has(taskId)) {
    console.log(`Task ${taskId} added to reminder set.`);
    toRemind.add(taskId);
    checkAndRemind(taskId, priority);
  }
}

function stopReminder(taskId) {
  if (toRemind.has(taskId)) {
    console.log(`Task ${taskId} removed from reminder set.`);
    toRemind.delete(taskId);
  }
}
function waitForTab(viewId, username) {
  const intervalId = setInterval(() => {
    if (observeTaskTab(viewId, username)) {
      clearInterval(intervalId); // Stop retrying once successful
    } else {
      console.log(`⏳ Waiting for tab ${viewId}...`);
    }
  }, 1000);
}

function observeTaskTab(viewId, username) {
  const iframe = document.querySelector('iframe');
  if (!iframe || !iframe.contentDocument) {
    console.log('Iframe not found');
    return false;
  }

  const container = iframe.contentDocument.querySelector(`[view_id="${viewId}"]`);
  if (!container) {
    console.warn(`Container for view_id=${viewId} not found.`);
    return false;
  }

  let debounceTimer = null;

  const observer = new MutationObserver((mutationsList) => {
    if (debounceTimer) clearTimeout(debounceTimer);

    debounceTimer = setTimeout(() => {
      console.log(`🟡 Tasks updated in tab ${viewId}`);
      const tasks = container.querySelectorAll('.webix_dataview_item.webix_kanban_list_item');
      tasks.forEach((task) => {
        const taskId = task.getAttribute('webix_f_id');
        const nameSpan = task.querySelector('.taskUserName');
        if (viewId == 1 && nameSpan && nameSpan.textContent.trim() === username) {
          startReminder(taskId, getPriority(task));
        }
        if (viewId == 2) {
          stopReminder(taskId);
        }
      });
    }, 100); 
  });

  observer.observe(container, {
    childList: true,
    subtree: true,
  });

  console.log(`✅ Now observing tab with view_id=${viewId}`);
  const dummyChild = document.createElement('div');
  container.appendChild(dummyChild);
  container.removeChild(dummyChild);
  return true;
}

function getPriority(taskElement) {
  if (!taskElement) return null;

  for (const child of taskElement.children) {
    for (const cls of child.classList) {
      const match = cls.match(/^priority_([1-6])$/);
      if (match) {
        return parseInt(match[1], 10) - 1;
      }
    }
  }

  return null;
}

// Function to get username asynchronously
function getUsername() {
  return new Promise((resolve, reject) => {
    const intervalId = setInterval(() => {
      const el = document.querySelector('.webix_img_btn');
      if (el) {
        const username = el.innerText.trim();
        console.log(`Username found: ${username}`);
        clearInterval(intervalId); // Stop once found
        resolve(username);
      } else {
        console.log('Waiting for username...');
      }
    }, 1000);
  });
}

window.addEventListener('load', async function() {
  console.log("Page loaded, starting username retrieval...");
  const username = await getUsername();
  console.log('Username:', username);

  waitForTab(1,username);
  waitForTab(2,username);

});