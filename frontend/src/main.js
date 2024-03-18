import { BACKEND_PORT } from './config.js';
// A helper you may want to use when uploading new images to the server.
import { fileToDataUrl } from './helpers.js';
import { threadManager } from './thread-menu.js';

let user = null;

if (localStorage.getItem('user') !== null) {
    user = JSON.parse(localStorage.getItem('user'));
}

const pages = ["page-login", "page-register", "page-dashboard", "page-create-thread"];

export const loadPage = (page) => {
    pages.forEach(p => {
        document.getElementById(p).style.display = "none";
    });
    document.getElementById(page).style.display = "block";
    if (page === "page-dashboard") {
        threadManager.reset();
        threadManager.loadThreads();
        document.getElementById(page).style.display = "grid";
    }
}

const loadNav = () => {
    if (user) {
        document.getElementById("nav-logged-out").style.display = "none";
        document.getElementById("nav-logged-in").style.display = "block";
    } else {
        document.getElementById("nav-logged-out").style.display = "block";
        document.getElementById("nav-logged-in").style.display = "none";
    }
}

const onLoad = () => {
    if (user !== null) {
        loadPage("page-dashboard");
    } else {
        loadPage("page-login");
    }
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
                localStorage.setItem('user', JSON.stringify(data));
                user = localStorage.getItem('user');
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
                localStorage.setItem('user', JSON.stringify(data));
                user = localStorage.getItem('user');
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
    localStorage.clear()
    user = null;
    loadNav();
    loadPage("page-login");
})

onLoad();
loadNav();

