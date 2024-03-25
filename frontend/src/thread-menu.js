import { BACKEND_PORT } from './config.js';
import { displayThread } from './thread-display.js';

import { validateUser } from './main.js';
import { loadPage } from './main.js';

import { getUserName } from './user.js';
import { formatTimeSince, displayError } from './helpers.js';

import { pollThreadUpdates } from './polling.js';

export const threadManager = {
    threadNumber: 0,
    loadThreads: function (callback) {
        return fetch(`${BACKEND_PORT}/threads?start=${this.threadNumber}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${validateUser.user.token}`
            }
        }).then(response => response.json())
            .then(data => {
                if (data.error) {
                    displayError(data.error);
                } else {
                    let promiseChain = Promise.resolve();

                    data.forEach(threadId => {
                        promiseChain = promiseChain.then(() => this.loadThread(threadId));


                        const intervalId = setInterval(() => {
                            pollThreadUpdates(threadId);
                        }, 1000);

                        validateUser.otherIntervalIds.push(intervalId);


                    });


                    promiseChain.then(() => {
                        this.threadNumber += data.length;
                        if (callback) {
                            callback();
                        }
                    });
                    validateUser.threadListCache.push(...data);

                    validateUser.setCache();

                    return data.length;
                }
            }).catch(error => {
                validateUser.loadCache();
                const cachedThreads = validateUser.threadListCache;
                if (cachedThreads && cachedThreads.length > 0) {
                    const startIndex = this.threadNumber;
                    const endIndex = startIndex + 5;
                    const threadsToDisplay = cachedThreads.slice(startIndex, endIndex);
                    let promiseChain = Promise.resolve();
                    threadsToDisplay.forEach(threadId => {
                        promiseChain = promiseChain.then(() => this.loadThread(threadId));
                    });

                    promiseChain.then(() => {
                        this.threadNumber += threadsToDisplay.length;
                        if (callback) {
                            callback();
                        }
                    });

                    return threadsToDisplay.length;
                } else {
                    displayError("No threads available offline.");
                    return 0;
                }
            });
    },

    loadThread: function (id) {
        return fetch(`${BACKEND_PORT}/thread?id=${id}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${validateUser.user.token}`
            }
        }).then(response => response.json())
            .then(data => {
                if (data.error) {
                    displayError(data.error);
                } else {
                    this.createThreadComponents(data, id);
                    validateUser.threadInfoCache[id] = data;
                }
            }).catch(error => {
                validateUser.loadCache();
                const cachedThreadData = validateUser.threadInfoCache[id];
                if (cachedThreadData) {
                    this.createThreadComponents(cachedThreadData, id);
                } else {
                    displayError("No threads available offline.");
                }
            })
    },

    createThreadComponents: function (data, id) {
        return getUserName(data.creatorId).then((name) => {
            const threadLink = document.createElement("a");
            threadLink.href = "#";
            threadLink.className = "list-group-item list-group-item-action thread-link";

            // Add thread title
            const title = document.createElement("h4");
            title.innerText = data.title;
            threadLink.appendChild(title);

            const threadLinkComponents = document.createElement("div");
            threadLinkComponents.className = "thread-link-components";



            // Add author
            const author = document.createElement("p");
            author.innerText = `${name}`;
            threadLinkComponents.appendChild(author);

            // Add post date
            const postDate = document.createElement("p");
            postDate.innerText = `${formatTimeSince(data.createdAt)}`;
            threadLinkComponents.appendChild(postDate);

            // Add number of likes
            const likes = document.createElement("p");
            likes.innerText = `Likes: ${data.likes.length}`;
            likes.id = `menu-likes-${id}`;
            threadLinkComponents.appendChild(likes);

            threadLink.appendChild(threadLinkComponents);

            const threadLinkClone = threadLink.cloneNode(true);

            // Append the thread div to the dashboard
            document.getElementById("mobile-dashboard-threads").appendChild(threadLinkClone);
            document.getElementById("dashboard-threads").appendChild(threadLink);

            threadLink.addEventListener("click", (e) => {
                displayThread(id);
            });

            threadLinkClone.addEventListener("click", (e) => {
                displayThread(id);
            });
        })
    },

    reset: function () {
        this.threadNumber = 0;
        this.initialLoadCount = 0;
        document.getElementById("dashboard-threads").innerText = "";
        document.getElementById("mobile-dashboard-threads").innerText = "";
        validateUser.resetCache();
    }
};




document.getElementById("create-thread-button").addEventListener("click", () => {
    loadPage("page-create-thread");
})

document.getElementById("mobile-create-thread-button").addEventListener("click", () => {
    loadPage("page-create-thread");
})

document.getElementById("new-thread-submit").addEventListener("click", () => {
    const title = document.getElementById("new-thread-title").value;
    const isPublic = document.getElementById("new-thread-public").checked;
    const content = document.getElementById("new-thread-content").value;

    const data = {
        title: title,
        isPublic: !isPublic,
        content: content
    };


    fetch(`${BACKEND_PORT}/thread`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${validateUser.user.token}`
        },
        body: JSON.stringify(data)
    }).then(response => response.json())
        .then(data => {
            if (data.error) {
                displayError(data.error);
            } else {
                loadPage("page-dashboard");
                displayThread(data.id);
            }
        }).catch(error => {
            displayError("Failed to create thread.");
        });
});
