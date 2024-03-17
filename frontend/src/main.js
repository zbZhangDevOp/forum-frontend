import { BACKEND_PORT } from './config.js';
// A helper you may want to use when uploading new images to the server.
import { fileToDataUrl } from './helpers.js';

let token = null;
let threadNumber = 0;

if (localStorage.getItem('token') !== null) {
    token = localStorage.getItem('token');
}

document.getElementById("register-submit").addEventListener("click", () => {
    const name = document.getElementById("register-name").value;
    const password = document.getElementById("register-password").value;
    const email = document.getElementById("register-email").value;
    const password_confirm = document.getElementById("register-password-confirm").value;

    if (password !== password_confirm) {
        alert("Passwords do not match");
        return;
    }

    const data = {
        name: name,
        password: password,
        email: email
    };

    fetch(`http://localhost:${BACKEND_PORT}/auth/register`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    }).then(response => response.json())
        .then(data => {
            if (data.error) {
                alert(data.error);
            } else {
                localStorage.setItem('token', data.token);
                token = localStorage.getItem('token');
                loadNav();
                loadPage("page-dashboard");
            }
        });
})

document.getElementById("login-submit").addEventListener("click", () => {
    const email = document.getElementById("login-email").value;
    const password = document.getElementById("login-password").value;
    const data = {
        email: email,
        password: password
    };

    fetch(`http://localhost:${BACKEND_PORT}/auth/login`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    }).then(response => response.json())
        .then(data => {
            if (data.error) {
                alert(data.error);
            } else {
                localStorage.setItem('token', data.token);
                token = localStorage.getItem('token');
                loadNav();
                loadPage("page-dashboard");
            }
        });
})

document.getElementById("nav-register").addEventListener("click", () => {
    loadPage("page-register");
})

document.getElementById("nav-login").addEventListener("click", () => {

    loadPage("page-login");
})

document.getElementById("nav-logout").addEventListener("click", () => {
    localStorage.removeItem('token');
    token = null;
    loadNav();
    loadPage("page-login");
})

const loadThreads = () => {
    fetch(`http://localhost:${BACKEND_PORT}/threads?start=${globalThis.threadNumber}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        }
    }).then(response => response.json())
        .then(data => {
            if (data.error) {
                alert(data.error);
            } else {
                const threads = data;
                console.log(threads)
                const dashboardThreads = document.getElementById("dashboard-threads");
                // dashboardThreads.innerText = "";
                threads.forEach(thread => {
                    loadThread(thread);
                });
                globalThis.threadNumber += threads.length;
            }
        });
}

const loadThread = (id) => {
    fetch(`http://localhost:${BACKEND_PORT}/thread?id=${id}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        }
    }).then(response => response.json())
        .then(data => {
            if (data.error) {
                alert(data.error);
            } else {
                // Create a div element for the thread
                // const threadDiv = document.createElement("div");
                // threadDiv.className = "thread-box";

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
}

const displayThread = (id) => {
    fetch(`http://localhost:${BACKEND_PORT}/thread?id=${id}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        }
    }).then(response => response.json())
        .then(data => {
            if (data.error) {
                alert(data.error);
            } else {
                const threadDiv = document.getElementById("thread");
                threadDiv.innerText = "";

                // Add thread title
                const title = document.createElement("h1");
                title.innerText = data.title;
                threadDiv.appendChild(title);

                // Body of the content
                const content = document.createElement("p");
                content.innerText = `Content: ${data.content}`;
                threadDiv.appendChild(content);

                // Add number of likes
                const likes = document.createElement("p");
                likes.innerText = `Likes: ${data.likes}`;
                threadDiv.appendChild(likes);
            }
        });
}




const pages = ["page-login", "page-register", "page-dashboard", "page-create-thread"];

const loadPage = (page) => {
    pages.forEach(p => {
        document.getElementById(p).style.display = "none";
    });
    document.getElementById(page).style.display = "block";
    if (page === "page-dashboard") {
        globalThis.threadNumber = 0;
        loadThreads();
        document.getElementById(page).style.display = "grid";
    }
}

const loadNav = () => {
    if (token) {
        document.getElementById("nav-logged-out").style.display = "none";
        document.getElementById("nav-logged-in").style.display = "block";
    } else {
        document.getElementById("nav-logged-out").style.display = "block";
        document.getElementById("nav-logged-in").style.display = "none";
    }
}

const onLoad = () => {
    if (token !== null) {
        loadPage("page-dashboard");
    } else {
        loadPage("page-login");
    }
}

onLoad();
loadNav();

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
            'Authorization': `Bearer ${token}`
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
    console.log(globalThis.threadNumber)
    loadThreads();
    console.log(globalThis.threadNumber)

});