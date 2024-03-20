import { BACKEND_PORT } from './config.js';
import { validateUser } from './main.js';
import { fileToDataUrl } from './helpers.js';
import { loadComments } from './comments.js';

let user = null;

if (localStorage.getItem('user') !== null) {
    user = JSON.parse(localStorage.getItem('user'));

}

export const getUserImg = (userId) => {
    return fetch(`http://localhost:${BACKEND_PORT}/comments?userId=${userId}`, {
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
                // fileToDataUrl(data.image)
                if (!data.image) {
                    return "asset/default.jpg";
                }
                return data.image;
            }
        });
}

export const openUserModal = (userId, threadId) => {

    document.getElementById("display-user").style.display = "block";

    loadUserThreads(userId);
    loadUserInfo(userId);


    document.getElementById("display-user-close").onclick = () => {
        document.getElementById("display-user").style.display = "none";
        loadComments(threadId);
    };
};

const fetchUserThreads = (threads = [], start = 0) => {
    return fetch(`http://localhost:${BACKEND_PORT}/threads?start=${start}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${validateUser.user.token}`
        }
    }).then(response => response.json())
        .then(data => {
            if (data.error) {
                alert(data.error);
                return threads; // Return the threads accumulated so far in case of an error
            } else {
                if (data.length === 0) {
                    // No more threads to load, return the accumulated threads
                    return threads;
                } else {
                    // Concatenate the newly fetched threads to the accumulated threads
                    const updatedThreads = threads.concat(data);
                    // Recursively call the function with the updated threads and new start index
                    return fetchUserThreads(updatedThreads, start + data.length);
                }
            }
        });
};


const loadUserThreads = (userId) => {
    fetchUserThreads().then(allThreads => {
        allThreads.filter(thread => thread.creatorId === userId)

        // Display all threads or perform other actions
        const threadPromises = allThreads.map(threadId => loadUserThread(threadId));

        Promise.all(threadPromises).then(() => {
        });
    });
}

const loadUserThread = (threadId) => {
    document.getElementById("user-threads").innerText = "";

    fetch(`http://localhost:${BACKEND_PORT}/thread?id=${threadId}`, {
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
                const thread = document.createElement("div");
                thread.className = "list-group-item list-group-item-action";

                // Add thread title
                const title = document.createElement("h4");
                title.innerText = data.title;
                thread.appendChild(title);

                // Add post content
                const content = document.createElement("p");
                content.innerText = `Content: ${data.content}`;
                thread.appendChild(content);

                // Add number of likes
                const likes = document.createElement("p");
                likes.innerText = `Likes: ${data.likes.length}`;
                thread.appendChild(likes);

                fetch(`http://localhost:${BACKEND_PORT}/comments?threadId=${threadId}`, {
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
                            const comments = document.createElement("p");
                            comments.innerText = `Comments: ${data.length}`;
                            thread.appendChild(comments);
                        }
                    });

                // Append the thread div to the dashboard
                document.getElementById("user-threads").appendChild(thread);
            }
        });
}

const loadUserInfo = (userId) => {
    document.getElementById("user-info").innerText = "";
    fetch(`http://localhost:${BACKEND_PORT}/user?userId=${userId}`, {
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
                const userInfo = document.getElementById("user-info");

                // Add thread title
                const name = document.createElement("h4");
                name.innerText = `Name: ${data.name}`;
                userInfo.appendChild(name);

                // Add post content
                const email = document.createElement("p");
                email.innerText = `Email: ${data.email}`;
                userInfo.appendChild(email);

                // Add number of likes
                const image = document.createElement("p");
                image.innerText = `Image: ${data.image}`;
                userInfo.appendChild(image);

                const isAdmin = document.createElement("p");
                isAdmin.innerText = `Admin: ${data.admin}`;
                userInfo.appendChild(isAdmin);
            }
        });
}

export const getUserName = (userId) => {
    return fetch(`http://localhost:${BACKEND_PORT}/comments?userId=${userId}`, {
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
                if (!data.name) {
                    return "New User";
                }
                return data.name;
            }
        });
}