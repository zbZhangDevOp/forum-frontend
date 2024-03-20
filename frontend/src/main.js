import { BACKEND_PORT } from './config.js';
// A helper you may want to use when uploading new images to the server.
import { threadManager } from './thread-menu.js';

export const validateUser = {
    user: null,
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
        localStorage.clear()
    }
}


const pages = ["page-login", "page-register", "page-dashboard", "page-create-thread"];

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

document.getElementById("register-submit").addEventListener("click", () => {
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
                alert(data.error);
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
onLoad();

