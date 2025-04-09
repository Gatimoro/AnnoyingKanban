chrome.runtime.onInstalled.addListener(() => {
  
});

chrome.action.onClicked.addListener(() => {
  focusOrOpenKanbanTab()
});
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "focus-tab") {
    focusOrOpenKanbanTab(message.reason || "Content script triggered");
  }
});

function focusOrOpenKanbanTab(reason = "Triggered externally") {
  const targetUrl = "http://192.168.11.237/chat/";

  chrome.tabs.query({}, (tabs) => {
    for (let tab of tabs) {
      if (tab.url && tab.url.startsWith(targetUrl)) {
        chrome.tabs.update(tab.id, { active: true });

        chrome.scripting.executeScript({
          target: { tabId: tab.id },
          function: () => {
            const el = document.querySelector('[webix_l_id="Kanban-tool"]');
            if (el) el.click();
          }
        });

        console.log(`⚡ Kanban tab focused due to: ${reason}`);
        return;
      }
    }

    chrome.tabs.create({ url: targetUrl }, (newTab) => {
      console.log(`Kanban tab opened due to: ${reason}`);
    });
  });
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "show-notification") {
    const { taskId, priority } = message;
    chrome.notifications.create(`reminder-${taskId}`, {
    type: "basic",
    iconUrl: "eye.png",
    title: "☠️ THE WATCHER IS WAITING...",
    message: `🩸 Task ${taskId} needs your attention (Priority ${priority + 1})`,
    priority: 2
    });
  }
});