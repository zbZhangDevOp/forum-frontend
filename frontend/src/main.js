import { BACKEND_PORT } from './config.js';
import { threadManager } from './thread-menu.js';
import { openCurrentUserModal, openUserSetting, openUserModal } from './user.js';
import { displayThread } from './thread-display.js';
import { fetchThreadsUserIsWatching, pollForNewComments } from './watch.js';
import { displayError } from './helpers.js';


export const validateUser = {
    user: null,
    watchThreads: {},
    pollIntervalId: null,
    otherIntervalIds: [],
    threadListCache: [],
    threadInfoCache: {},
    commentListCache: {},
    commentInfoCache: {},
    userInfoCache: {},
    loadUser: function () {
        if (localStorage.getItem('user') !== null) {
            this.user = JSON.parse(localStorage.getItem('user'));
        }
    },
    setUser: function (data) {
        localStorage.setItem('user', JSON.stringify(data));
        this.loadUser();
    },
    loadCache: function () {
        if (localStorage.getItem('threadListCache') !== null) {
            this.threadListCache = JSON.parse(localStorage.getItem('threadListCache'));
        }
        if (localStorage.getItem('threadInfoCache') !== null) {
            this.threadInfoCache = JSON.parse(localStorage.getItem('threadInfoCache'));
        }
        if (localStorage.getItem('commentInfoCache') !== null) {
            this.commentInfoCache = JSON.parse(localStorage.getItem('commentInfoCache'));
        }
        if (localStorage.getItem('userInfoCache') !== null) {
            this.userInfoCache = JSON.parse(localStorage.getItem('userInfoCache'));
        }
        if (localStorage.getItem('commentListCache') !== null) {
            this.commentListCache = JSON.parse(localStorage.getItem('commentListCache'));
        }
        if (localStorage.getItem('commentInfoCache') !== null) {
            this.commentInfoCache = JSON.parse(localStorage.getItem('commentInfoCache'));
        }
    },

    setCache: function () {
        localStorage.setItem('threadListCache', JSON.stringify(this.threadListCache));
        localStorage.setItem('threadInfoCache', JSON.stringify(this.threadInfoCache));
        localStorage.setItem('commentInfoCache', JSON.stringify(this.commentInfoCache));
        localStorage.setItem('userInfoCache', JSON.stringify(this.userInfoCache));
        localStorage.setItem('commentListCache', JSON.stringify(this.commentListCache));
        localStorage.setItem('commentInfoCache', JSON.stringify(this.commentInfoCache));
    },
    reset: function () {
        this.user = null;
        this.watchThreads = {};
        if (this.pollIntervalId) {
            clearInterval(this.pollIntervalId);
        }
        this.pollIntervalId = null;

        for (let i = 0; i < this.otherIntervalIds.length; i++) {
            clearInterval(this.otherIntervalIds[i]);
        }

        this.otherIntervalIds = [];

        localStorage.clear()
    },
    resetCache: function () {
        this.threadListCache = [];
        this.threadInfoCache = {};
        this.commentInfoCache = {};
        this.userInfoCache = {};
        this.commentListCache = {};
        this.commentInfoCache = {};
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
        document.getElementById("nav-title").style.display = "flex";
    } else {
        document.getElementById("nav-logged-out").style.display = "flex";
        document.getElementById("nav-logged-in").style.display = "none";
        document.getElementById("nav-title").style.display = "none";

    }
}

const onLoad = () => {
    validateUser.loadUser();
    loadNav();

    if (validateUser.user !== null) {
        fetchThreadsUserIsWatching();
        const intervalId = setInterval(pollForNewComments, 1000);
        validateUser.otherIntervalIds.push(intervalId);
        loadPage("page-dashboard");
    } else {
        loadPage("page-login");
    }
}

document.getElementById("register-submit").addEventListener("click", (e) => {
    e.preventDefault();
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

document.getElementById("login-submit").addEventListener("click", (e) => {
    e.preventDefault();

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
    validateUser.resetCache();
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

document.getElementById("mobile-dashboard-threads").addEventListener("scroll", () => {
    let div = document.getElementById("mobile-dashboard-threads");
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

document.getElementById("mobile-threads").addEventListener("click", () => {
    let div = document.getElementById("mobile-threads-menu");
    div.style.display = div.style.display === "none" ? "block" : "none";

})

function handleRouting() {
    const fragment = window.location.hash;


    const threadMatch = fragment.match(/#thread=(\d+)/);
    if (threadMatch) {
        const threadId = threadMatch[1];
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

}

window.addEventListener('hashchange', handleRouting);
window.addEventListener('load', handleRouting);


onLoad();

Notification.requestPermission().then(perm => {
    if (perm === "granted") {
        new Notification("Notifications enabled");
    } else {
        new Notification("Notifications disabled");
    }
})


