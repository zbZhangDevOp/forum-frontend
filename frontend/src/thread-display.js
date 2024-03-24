import { BACKEND_PORT } from './config.js';
import { validateUser, loadPage } from './main.js';
import { postMainComment, loadComments } from './comments.js';


import { formatTimeSince, displayError } from './helpers.js';

import { isAdmin, openUserModal, getUserImg, getUserName } from './user.js';

export const displayThread = (id) => {
    fetch(`http://localhost:${BACKEND_PORT}/thread?id=${id}`, {
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
                createThreadDisplayComponents(data, id);
            }
        }).catch(error => {
            validateUser.loadCache();
            const cachedThreadData = validateUser.threadInfoCache[id];
            if (cachedThreadData) {
                createThreadDisplayComponents(cachedThreadData, id);
            } else {
                displayError("Thread not found.");
            }
        });
}

const createThreadDisplayComponents = (data, id) => {
    return isAdmin(validateUser.user.userId).then((isAdmin) => {
        getUserImg(data.creatorId).then(profilePictureUrl => {
            getUserName(data.creatorId).then(userName => {
                const threadDiv = document.getElementById("thread");
                threadDiv.innerText = "";

                const threadHead = document.createElement("div");
                threadHead.id = "thread-head";

                const threadHeadComponents = document.createElement("div");
                threadHeadComponents.id = "thread-head-components";
                threadHeadComponents.className = "btn-group";

                const title = document.createElement("h1");
                title.innerText = `${data.title}${data.lock ? " (🔒)" : ""}`;
                threadHead.appendChild(title);

                const likeButton = document.createElement("button");
                likeButton.className = "btn btn-light";
                likeButton.id = "like-button";
                likeButton.innerHTML = data.likes.includes(validateUser.user.userId) ? "♥ Unlike" : "♡ Like";
                likeButton.addEventListener("click", () => {
                    toggleLikeThread(data.lock, id);
                });

                if (data.lock) {
                    likeButton.disabled = true;
                }

                threadHeadComponents.appendChild(likeButton);


                const watchButton = document.createElement("button");
                watchButton.className = "btn btn-light";
                watchButton.id = "watch-button";
                watchButton.innerHTML = data.watchees.includes(validateUser.user.userId) ? "★ Unwatch" : "☆ Watch";
                watchButton.addEventListener("click", () => {
                    toggleWatchThread(id);
                });
                threadHeadComponents.appendChild(watchButton);

                if (data.lock) {
                    watchButton.disabled = true;
                }


                threadHead.appendChild(threadHeadComponents);

                threadDiv.appendChild(threadHead);

                const threadCreatorInfo = document.createElement("div");
                threadCreatorInfo.className = "comment-heading";


                const profilePic = document.createElement("img");
                profilePic.src = profilePictureUrl;
                profilePic.className = "profile-pic";
                profilePic.alt = "Profile Picture";
                threadCreatorInfo.appendChild(profilePic);

                profilePic.onclick = function () {
                    openUserModal(data.creatorId, data.id);
                };

                const nameBlock = document.createElement("div");
                nameBlock.id = "name-block";

                const username = document.createElement("a");
                username.className = "comment-username fs-5";
                username.innerText = userName;
                nameBlock.appendChild(username);

                username.onclick = function () {
                    openUserModal(data.creatorId, data.id);
                };

                const metadata = document.createElement("div");
                metadata.id = "thread-metadata";


                const time = document.createElement("p");
                time.className = "text-body-secondary";
                time.innerText = `${formatTimeSince(data.createdAt)} | `;

                metadata.appendChild(time);






                const likesGroup = document.createElement("div");
                likesGroup.className = "dropdown";


                const numLikes = document.createElement("a");
                numLikes.className = "text-body-secondary";
                numLikes.innerText = `Likes: ${data.likes.length}`;
                numLikes.id = `thread-likes-${id}`;

                likesGroup.appendChild(numLikes);

                const likesDropdown = document.createElement("ul");
                likesDropdown.className = "dropdown-menu";

                likesGroup.appendChild(likesDropdown);

                const likeUserPromises = data.likes.map(userId => createLikeUser(userId));

                Promise.all(likeUserPromises).then(likeUsers => {
                    likeUsers.forEach(likeUser => {
                        console.log(likeUser);
                        likesDropdown.appendChild(likeUser);
                    });
                })

                numLikes.addEventListener("click", () => {
                    if (likesDropdown.style.display === "block") {
                        likesDropdown.style.display = "none";
                    } else {
                        likesDropdown.style.display = "block";
                    }
                });

                metadata.appendChild(likesGroup);

                nameBlock.appendChild(metadata);
                threadCreatorInfo.appendChild(nameBlock);
                threadDiv.appendChild(threadCreatorInfo);

                const content = document.createElement("p");
                content.innerText = `${data.content}`;
                content.className = "fs-5 comment-content";
                threadDiv.appendChild(content);


                const threadModify = document.createElement("div");
                threadModify.id = "thread-modify";
                threadModify.className = "btn-group";

                const editButton = document.createElement("button");
                editButton.innerText = "Edit";
                editButton.className = "btn btn-light btn-sm";
                editButton.addEventListener("click", () => {
                    openEditThreadModal(id);
                });
                threadModify.appendChild(editButton);

                if (data.lock) {
                    editButton.disabled = true;
                }


                const deleteButton = document.createElement("button");
                deleteButton.innerText = "Delete";
                deleteButton.className = "btn btn-light btn-sm";
                deleteButton.addEventListener("click", () => {
                    deleteThread(id);
                });
                threadModify.appendChild(deleteButton);


                if (!isAdmin && data.creatorId !== validateUser.user.userId) {
                    threadModify.style.display = "none";
                }

                threadDiv.appendChild(threadModify);



                const commentDiv = document.createElement("div");
                commentDiv.id = "comments-container";


                threadDiv.appendChild(commentDiv);



                const newComment = document.createElement("div");
                newComment.id = "new-comment";
                newComment.className = "form-floating";

                const newCommentText = document.createElement("textarea");
                newCommentText.id = "new-comment-text";
                newCommentText.className = "form-control";
                newCommentText.placeholder = "New Comment";



                const newCommentLabel = document.createElement("label");
                newCommentLabel.innerText = "New Comment";
                newCommentLabel.for = "new-comment-text";

                const newCommentSubmit = document.createElement("button");
                newCommentSubmit.id = "new-comment-submit";
                newCommentSubmit.innerText = "Submit";
                newCommentSubmit.className = "btn btn-primary";

                if (data.lock) {
                    newCommentText.disabled = true;
                    newCommentSubmit.disabled = true;
                }

                newComment.appendChild(newCommentText);
                newComment.appendChild(newCommentLabel);
                newComment.appendChild(newCommentSubmit);

                newCommentSubmit.addEventListener("click", () => {
                    postMainComment(id);
                });

                threadDiv.appendChild(newComment);
                loadComments(id);
            });
        });
    });

}

const createLikeUser = (userId) => {
    return getUserName(userId).then(userName => {

        const likeUser = document.createElement("li");
        likeUser.className = "dropdown-item";

        const userLink = document.createElement("a");


        userLink.innerText = userName;

        userLink.onclick = () => {
            openUserModal(userId);
        };

        likeUser.appendChild(userLink);

        console.log(likeUser)
        return likeUser;
    });

}

const openEditThreadModal = (id) => {
    fetch(`http://localhost:${BACKEND_PORT}/thread?id=${id}`, {
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
                document.getElementById("edit-thread-title").value = data.title;
                document.getElementById("edit-thread-content").value = data.content;
                document.getElementById("edit-thread-public").checked = data.isPublic;
                document.getElementById("edit-thread-locked").checked = data.lock;
                document.getElementById("edit-thread-modal").style.display = "block";

                document.getElementById("edit-thread-submit").onclick = () => {
                    saveThreadChanges(id);
                };

                document.getElementById("edit-thread-close").onclick = () => {
                    document.getElementById("edit-thread-modal").style.display = "none";
                };
                document.getElementById("edit-thread-cross").onclick = () => {
                    document.getElementById("edit-thread-modal").style.display = "none";
                };
            }
        }).catch(error => {
            displayError("Failed to load thread data.");
        })
};

const saveThreadChanges = (id) => {
    const updatedData = {
        id: id,
        title: document.getElementById("edit-thread-title").value,
        content: document.getElementById("edit-thread-content").value,
        isPublic: document.getElementById("edit-thread-public").checked,
        lock: document.getElementById("edit-thread-locked").checked
    };

    fetch(`http://localhost:${BACKEND_PORT}/thread`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${validateUser.user.token}`
        },
        body: JSON.stringify(updatedData)
    }).then(response => response.json())
        .then(data => {
            if (data.error) {
                displayError(data.error);
            } else {
                document.getElementById("edit-thread-modal").style.display = "none";
                displayThread(id); // Refresh the thread display
            }
        });
};

const deleteThread = (id) => {
    if (confirm("Are you sure you want to delete this thread?")) {
        const deleteData = {
            id: id
        };

        fetch(`http://localhost:${BACKEND_PORT}/thread`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${validateUser.user.token}`
            },
            body: JSON.stringify(deleteData)
        }).then(response => response.json())
            .then(data => {
                if (data.error) {
                    displayError(data.error);
                } else {
                    loadPage("page-dashboard"); // Redirect to the dashboard or the latest thread
                }
            });
    }
};

const isThreadLiked = (id) => {
    return fetch(`http://localhost:${BACKEND_PORT}/thread?id=${id}`, {
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
                return data.likes.includes(validateUser.user.userId);
            }
        });
}

const toggleLikeThread = (isLocked, id) => {
    if (isLocked) {
        displayError("Locked threads cannot be liked.");
        return;
    }

    isThreadLiked(id).then(isLiked => {
        const likeThread = {
            "id": id,
            "turnon": !isLiked
        };

        fetch(`http://localhost:${BACKEND_PORT}/thread/like`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${validateUser.user.token}`
            },
            body: JSON.stringify(likeThread)
        })
            .then(response => response.json())
            .then(data => {
                if (data.error) {
                    displayError(data.error);
                } else {
                    const likeButton = document.getElementById("like-button");
                    likeButton.innerHTML = !isLiked ? "♥ Unlike" : "♡ Like";
                }
            })
            .catch(error => {
                displayError(error);
            });
    });

}
const isThreadWatched = (id) => {
    return fetch(`http://localhost:${BACKEND_PORT}/thread?id=${id}`, {
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
                return data.watchees.includes(validateUser.user.userId);
            }
        });
}

const toggleWatchThread = (id) => {
    isThreadWatched(id).then(isWatching => {
        const likeThread = {
            "id": id,
            "turnon": !isWatching
        };

        fetch(`http://localhost:${BACKEND_PORT}/thread/watch`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${validateUser.user.token}`
            },
            body: JSON.stringify(likeThread)
        })
            .then(response => response.json())
            .then(data => {
                if (data.error) {
                    displayError(data.error);
                } else {
                    const watchButton = document.getElementById("watch-button");
                    watchButton.innerHTML = !isWatching ? "★ Unwatch" : "☆ Watch";
                }
            })
            .catch(error => {
                displayError(error);
            });
    });

}

export const isThreadLocked = (id) => {
    return fetch(`http://localhost:${BACKEND_PORT}/thread?id=${id}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${validateUser.user.token}`
        },
    })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                displayError(data.error);
            } else {
                return data.lock;
            }
        }).catch(error => {

            validateUser.loadCache();
            const cachedThreadInfo = validateUser.threadInfoCache[id];
            if (cachedThreadInfo && cachedThreadInfo.lock) {
                return cachedThreadInfo.lock;
            } else {
                return '';
            }
        });

}
