import { BACKEND_PORT } from './config.js';
import { loadPage, validateUser } from './main.js';
import { fileToDataUrl } from './helpers.js';

let user = null;

if (localStorage.getItem('user') !== null) {
    user = JSON.parse(localStorage.getItem('user'));

}

export const getUserImg = (userId) => {
    return fetch(`http://localhost:${BACKEND_PORT}/user?userId=${userId}`, {
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
                if (!data.image) {
                    return "asset/default.jpg";
                }
                return data.image;
            }
        });
}

export const openUserModal = (userId) => {

    fetch(`http://localhost:${BACKEND_PORT}/user?userId=${userId}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${validateUser.user.token}`
        }
    }).then(response => response.json()).then(data => {
        if (data.error || !data) {
            alert("Error: User not found or invalid userId.");
            return; // Exit the function if there's an error
        }

        document.getElementById("display-user").style.display = "block";

        loadUserThreads(userId);
        loadUserInfo(userId);

        document.getElementById("display-user-close").onclick = () => {
            document.getElementById("display-user").style.display = "none";
        };

        document.getElementById("display-user-cross").onclick = () => {
            document.getElementById("display-user").style.display = "none";
        };
    });
};

export const openCurrentUserModal = (userId) => {

    document.getElementById("display-user").style.display = "block";

    loadUserThreads(userId);
    loadUserInfo(userId);


    document.getElementById("display-user-close").onclick = () => {
        document.getElementById("display-user").style.display = "none";
    };

    document.getElementById("display-user-cross").onclick = () => {
        document.getElementById("display-user").style.display = "none";
    };
};

export const fetchUserThreads = (threads = [], start = 0) => {
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
                    console.log(threads);
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
                content.innerText = `${data.content}`;
                thread.appendChild(content);

                const threadFooter = document.createElement("div");
                threadFooter.className = "thread-footer thread-link-components";


                // Add number of likes
                const likes = document.createElement("p");
                likes.innerText = `Likes: ${data.likes.length}`;
                threadFooter.appendChild(likes);

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
                            threadFooter.appendChild(comments);
                        }
                    });

                thread.appendChild(threadFooter);

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
                getUserImg(userId).then(profilePictureUrl => {
                    isAdmin(validateUser.user.userId).then((admin) => {
                        const userInfo = document.getElementById("user-info");
                        userInfo.innerText = "";

                        const userHeader = document.createElement("div");
                        userHeader.id = "user-header";

                        const profilePic = document.createElement("img");
                        profilePic.src = profilePictureUrl;
                        profilePic.className = "img-thumbnail user-header-profile-pic";
                        profilePic.alt = "Profile Picture";
                        userHeader.appendChild(profilePic);


                        // Add thread title
                        const name = document.createElement("h4");
                        name.innerText = `${data.name ? data.name : "New User"}`;
                        userHeader.appendChild(name);

                        const adminStatus = document.createElement("select");
                        adminStatus.id = "update-user-admin";
                        adminStatus.className = "form-select";
                        adminStatus.disabled = false;

                        const adminOption = document.createElement("option");
                        adminOption.innerText = "Admin";

                        const userOption = document.createElement("option");
                        userOption.innerText = "User";

                        data.admin ? adminOption.selected = true : userOption.selected = true;
                        if (!admin) {
                            adminStatus.disabled = true;
                        }

                        adminStatus.appendChild(adminOption);
                        adminStatus.appendChild(userOption);

                        const editButton = document.createElement("button");
                        editButton.innerText = "Update";
                        editButton.className = "btn btn-light btn-sm";
                        editButton.addEventListener("click", () => {
                            updateUserAdmin(data.id);
                        });

                        userHeader.appendChild(adminStatus);

                        if (admin) {
                            userHeader.appendChild(editButton);
                        }

                        userInfo.appendChild(userHeader);

                        // Add post content
                        const email = document.createElement("p");
                        email.innerText = `Email: ${data.email}`;
                        userInfo.appendChild(email);

                        const threadsTitle = document.createElement("h4");
                        threadsTitle.innerText = "Threads";
                        userInfo.appendChild(threadsTitle);
                    })
                })
            }
        });
}

export const getUserName = (userId) => {
    return fetch(`http://localhost:${BACKEND_PORT}/user?userId=${userId}`, {
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
                return data.name;
            }
        });
}

export const isAdmin = (userId) => {
    return fetch(`http://localhost:${BACKEND_PORT}/user?userId=${userId}`, {
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
                return data.admin;
            }
        });
}

export const openUserSetting = (id) => {
    document.getElementById("update-user-submit").onclick = () => {
        saveUserChanges(id);
    };
}

const saveUserChanges = () => {
    const password = document.getElementById("update-user-password").value;
    const name = document.getElementById("update-user-name").value;
    const email = document.getElementById("update-user-email").value;
    const image = document.getElementById("update-user-image").files[0];

    const updatedData = {};

    if (password) {
        updatedData.password = password;
    }

    if (name) {
        updatedData.name = name;
    }

    if (email) {
        updatedData.email = email;
    }

    const sendUpdateRequest = () => {
        fetch(`http://localhost:${BACKEND_PORT}/user`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${validateUser.user.token}`
            },
            body: JSON.stringify(updatedData)
        }).then(response => response.json())
            .then(data => {
                if (data.error) {
                    alert(data.error);
                } else {
                    loadPage("page-dashboard");
                }
            });
    };

    if (image) {
        fileToDataUrl(image).then(dataUrl => {
            updatedData.image = dataUrl;
            sendUpdateRequest();
        }).catch(error => {
            console.error('Error converting file to data URL:', error);
        });
    } else {
        sendUpdateRequest();
    }
};

const updateUserAdmin = (userId) => {
    const isAdmin = document.getElementById("update-user-admin").value;

    const updatedData = {
        userId: userId,
        "turnon": isAdmin
    }

    fetch(`http://localhost:${BACKEND_PORT}/user/admin`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${validateUser.user.token}`
        },
        body: JSON.stringify(updatedData)
    }).then(response => response.json())
        .then(data => {
            if (data.error) {
                alert(data.error);
            } else {
            }
        });
}