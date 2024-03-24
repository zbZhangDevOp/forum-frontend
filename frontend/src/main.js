import { BACKEND_PORT } from './config.js';
import { threadManager } from './thread-menu.js';
import { openCurrentUserModal, openUserSetting, openUserModal } from './user.js';
import { displayThread } from './thread-display.js';
import { fetchThreadsUserIsWatching, pollForNewComments } from './watch.js';


export const validateUser = {
    user: null,
    watchThreads: {},
    loadUser: function () {
        if (localStorage.getItem('user') !== null) {
            this.user = JSON.parse(localStorage.getItem('user'));
        }
    },
    setUser: function (data) {
        localStorage.setItem('user', JSON.stringify(data));
        this.loadUser();
    },
    reset: function () {
        this.user = null;
        this.watchThreads = {};
        localStorage.clear()
    }
}


const pages = ["page-login", "page-register", "page-dashboard", "page-create-thread", "page-user-settings"];

export const loadPage = (page) => {
    pages.forEach(p => {
        document.getElementById(p).style.display = "none";
    });
    document.getElementById(page).style.display = "block";
    if (page === "page-dashboard") {
        threadManager.reset();

        threadManager.loadThreads(() => {
            threadManager.loadThreads(() => { threadManager.loadThreads(); }); // Call the second time after the first call is complete
        });

        document.getElementById(page).style.display = "grid";
    }
}

const loadNav = () => {
    if (validateUser.user) {
        document.getElementById("nav-logged-out").style.display = "none";
        document.getElementById("nav-logged-in").style.display = "flex";
    } else {
        document.getElementById("nav-logged-out").style.display = "flex";
        document.getElementById("nav-logged-in").style.display = "none";
    }
}

const onLoad = () => {
    validateUser.loadUser();
    loadNav();

    if (validateUser.user !== null) {
        loadPage("page-dashboard");
    } else {
        loadPage("page-login");
    }
}

const displayError = (error) => {
    const errorElement = document.getElementById("error-modal");
    errorElement.style.display = "block";

    const errorText = document.getElementById("error-modal-body");

    errorText.innerText = "";

    const errorTextChild = document.createElement("p");
    errorTextChild.innerText = error;

    errorText.appendChild(errorTextChild);

    const close = document.getElementById("error-modal-close");
    close.addEventListener("click", () => {
        errorElement.style.display = "none";
    })

    const closeBtn = document.getElementById("error-modal-close-btn");
    closeBtn.addEventListener("click", () => {
        errorElement.style.display = "none";
    })

}

document.getElementById("register-submit").addEventListener("click", () => {
    const password = document.getElementById("register-password").value;
    const name = document.getElementById("register-name").value;
    const email = document.getElementById("register-email").value;
    const password_confirm = document.getElementById("register-password-confirm").value;

    if (!name) {
        displayError("Name cannot be empty");
        return;
    }

    if (password !== password_confirm) {
        displayError("Passwords do not match");
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
                displayError(data.error);
            } else {
                validateUser.setUser(data);
                onLoad();
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
                displayError(data.error);
            } else {
                validateUser.setUser(data);
                onLoad();

            }
        });
})

document.getElementById("nav-register").addEventListener("click", () => {
    loadPage("page-register");
})

document.getElementById("nav-login").addEventListener("click", () => {
    loadPage("page-login");
})

document.getElementById("nav-dashboard").addEventListener("click", () => {
    loadPage("page-dashboard");
})

document.getElementById("nav-logout").addEventListener("click", () => {
    validateUser.reset();
    onLoad();
})

document.getElementById("dashboard-threads").addEventListener("scroll", () => {
    let div = document.getElementById("dashboard-threads");
    let scrollTop = div.scrollTop;
    let scrollHeight = div.scrollHeight;
    let clientHeight = div.clientHeight;
    if (clientHeight + scrollTop >= scrollHeight - 50) {
        threadManager.loadThreads();
    }
})

document.getElementById("user-dropdown-btn").addEventListener("click", () => {
    const dropdown = document.getElementById("user-dropdown");
    if (dropdown.style.display === "none") {
        dropdown.style.display = "block";
    } else {
        dropdown.style.display = "none";
    }

    document.getElementById("current-user-info").addEventListener("click", () => {
        openCurrentUserModal(validateUser.user.userId);
        dropdown.style.display = "none";
    })

    document.getElementById("update-user-info").addEventListener("click", () => {
        loadPage("page-user-settings");
        dropdown.style.display = "none";
        openUserSetting(validateUser.user.userId);
    })
})

function handleRouting() {
    const fragment = window.location.hash;

    console.log(fragment);

    // Matches '#thread={threadId}'
    const threadMatch = fragment.match(/#thread=(\d+)/);
    if (threadMatch) {
        const threadId = threadMatch[1];
        console.log(threadMatch);
        console.log(threadId);
        displayThread(threadId);
        return;
    }

    // Matches '#profile'
    if (fragment === '#profile') {
        openCurrentUserModal(validateUser.user.userId);
        return;
    }

    // Matches '#profile={userId}'
    const profileMatch = fragment.match(/#profile=(\d+)/);
    if (profileMatch) {
        const userId = profileMatch[1];
        openUserModal(userId);
        return;
    }

    // Default route (could be your home page or dashboard)
}

window.addEventListener('hashchange', handleRouting);
window.addEventListener('load', handleRouting);
window.addEventListener('load', fetchThreadsUserIsWatching);


onLoad();

Notification.requestPermission().then(perm => {
    if (perm === "granted") {
        console.log("Notifications sadfasdf");
        new Notification("Notifications enabled");
    } else {
        new Notification("Notifications disabled");
        console.log("Notifications disabled");
    }
})


setInterval(pollForNewComments, 1000);
