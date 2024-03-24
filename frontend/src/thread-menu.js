import { BACKEND_PORT } from './config.js';
import { displayThread } from './thread-display.js';

import { validateUser } from './main.js';
import { loadPage } from './main.js';

import { getUserName } from './user.js';
import { formatTimeSince } from './helpers.js';

export const threadManager = {
    threadNumber: 0,


    loadThreads: function (callback) {
        return fetch(`http://localhost:${BACKEND_PORT}/threads?start=${this.threadNumber}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${validateUser.user.token}`
            }
        }).then(response => response.json())
            .then(data => {
                if (data.error) {
                    alert(data.error);
                } else {
                    let promiseChain = Promise.resolve();

                    data.forEach(threadId => {
                        promiseChain = promiseChain.then(() => this.loadThread(threadId));
                    });




                    promiseChain.then(() => {
                        this.threadNumber += data.length;
                        if (callback) {
                            callback();
                        }

                    });
                    return data.length;
                }
            });
    },

    loadThread: function (id) {
        return fetch(`http://localhost:${BACKEND_PORT}/thread?id=${id}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${validateUser.user.token}`
            }
        }).then(response => response.json())
            .then(data => {
                if (data.error) {
                    alert(data.error);
                } else {
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
                        threadLinkComponents.appendChild(likes);

                        threadLink.appendChild(threadLinkComponents);

                        // Append the thread div to the dashboard
                        document.getElementById("dashboard-threads").appendChild(threadLink);

                        threadLink.addEventListener("click", (e) => {
                            displayThread(id);
                        });

                    })
                }
            })
    },

    reset: function () {
        this.threadNumber = 0;
        this.initialLoadCount = 0;
        document.getElementById("dashboard-threads").innerText = "";
    }
};




document.getElementById("create-thread-button").addEventListener("click", () => {
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


    fetch(`http://localhost:${BACKEND_PORT}/thread`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${validateUser.user.token}`
        },
        body: JSON.stringify(data)
    }).then(response => response.json())
        .then(data => {
            if (data.error) {
                alert(data.error);
            } else {
                loadPage("page-dashboard");
                displayThread(data.id);
            }
        });
});
