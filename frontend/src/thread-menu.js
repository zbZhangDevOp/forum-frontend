import { BACKEND_PORT } from './config.js';
import { displayThread } from './thread-display.js';


let user = null;

if (localStorage.getItem('user') !== null) {
    user = JSON.parse(localStorage.getItem('user'));

}

export const threadManager = {
    threadNumber: 0,

    loadThreads: function () {
        fetch(`http://localhost:${BACKEND_PORT}/threads?start=${this.threadNumber}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${user.token}`
            }
        }).then(response => response.json())
            .then(data => {
                if (data.error) {
                    alert(data.error);
                } else {
                    const threadPromises = data.map(threadId => this.loadThread(threadId));
                    Promise.all(threadPromises).then(() => {
                        if (this.threadNumber === 0 && data.length > 0) {
                            displayThread(data[0]);
                        }
                        console.log("All threads loaded");
                        this.threadNumber += data.length;
                    });
                }
            });
    },

    loadThread: function (id) {
        fetch(`http://localhost:${BACKEND_PORT}/thread?id=${id}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${user.token}`
            }
        }).then(response => response.json())
            .then(data => {
                if (data.error) {
                    alert(data.error);
                } else {
                    const threadLink = document.createElement("a");
                    threadLink.href = "#";
                    threadLink.className = "thread-box";

                    // Add thread title
                    const title = document.createElement("h4");
                    title.innerText = data.title;
                    threadLink.appendChild(title);

                    // Add post date
                    const postDate = document.createElement("p");
                    postDate.innerText = `Date: ${data.createdAt}`;
                    threadLink.appendChild(postDate);

                    // Add author
                    const author = document.createElement("p");
                    author.innerText = `Author: ${data.creatorId}`;
                    threadLink.appendChild(author);

                    // Add number of likes
                    const likes = document.createElement("p");
                    likes.innerText = `Likes: ${data.likes}`;
                    threadLink.appendChild(likes);

                    // Append the thread div to the dashboard
                    document.getElementById("dashboard-threads").appendChild(threadLink);

                    threadLink.addEventListener("click", (e) => {
                        displayThread(id);
                    });
                }
            });
    },

    reset: function () {
        this.threadNumber = 0;
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
        isPublic: isPublic,
        content: content
    };


    fetch(`http://localhost:${BACKEND_PORT}/thread`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify(data)
    }).then(response => response.json())
        .then(data => {
            if (data.error) {
                alert(data.error);
            } else {
                loadPage("page-dashboard");
            }
        });
});

document.getElementById("more-thread").addEventListener("click", () => {
    threadManager.loadThreads();

});