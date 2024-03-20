import { BACKEND_PORT } from './config.js';
import { loadPage } from './main.js';
import { postMainComment, loadComments } from './comments.js';

import { validateUser } from './main.js';

import { formatTimeSince } from './helpers.js';

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
                alert(data.error);
            } else {
                const threadDiv = document.getElementById("thread");
                threadDiv.innerText = "";

                const threadHead = document.createElement("div");
                threadHead.id = "thread-head";

                const threadHeadComponents = document.createElement("div");
                threadHeadComponents.id = "thread-head-components";
                threadHeadComponents.className = "btn-group";

                const title = document.createElement("h1");
                title.innerText = data.title;
                threadHead.appendChild(title);

                const likeButton = document.createElement("button");
                likeButton.className = "btn btn-light";
                likeButton.id = "like-button";
                likeButton.innerHTML = data.likes.includes(validateUser.user.userId) ? "♥ Unlike" : "♡ Like";
                likeButton.addEventListener("click", () => {
                    toggleLikeThread(data.lock, id);
                });

                threadHeadComponents.appendChild(likeButton);


                const watchButton = document.createElement("button");
                watchButton.className = "btn btn-light";
                watchButton.id = "watch-button";
                watchButton.innerHTML = data.watchees.includes(validateUser.user.userId) ? "★ Unwatch" : "☆ Watch";
                watchButton.addEventListener("click", () => {
                    toggleWatchThread(id);
                });
                threadHeadComponents.appendChild(watchButton);




                threadHead.appendChild(threadHeadComponents);

                threadDiv.appendChild(threadHead);

                const likes = document.createElement("p");
                likes.className = "text-body-secondary";
                likes.innerText = `${formatTimeSince(data.createdAt)} | Likes: ${data.likes.length}`;
                threadDiv.appendChild(likes);


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


                const deleteButton = document.createElement("button");
                deleteButton.innerText = "Delete";
                deleteButton.className = "btn btn-light btn-sm";
                deleteButton.addEventListener("click", () => {
                    deleteThread(id);
                });
                threadModify.appendChild(deleteButton);

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

                newComment.appendChild(newCommentText);
                newComment.appendChild(newCommentLabel);
                newComment.appendChild(newCommentSubmit);

                newCommentSubmit.addEventListener("click", () => {
                    postMainComment(id);
                });

                threadDiv.appendChild(newComment);




                loadComments(id);
            }
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
                alert(data.error);
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
            }
        });
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
                alert(data.error);
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
                    alert(data.error);
                } else {
                    alert("Thread deleted successfully!");
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
                alert(data.error);
            } else {
                return data.likes.includes(validateUser.user.userId);
            }
        });
}

const toggleLikeThread = (isLocked, id) => {
    if (isLocked) {
        alert("Locked threads cannot be liked.");
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
                    alert(data.error);
                } else {
                    const likeButton = document.getElementById("like-button");
                    likeButton.innerHTML = !isLiked ? "♥ Unlike" : "♡ Like";
                }
            })
            .catch(error => {
                console.error('Error liking thread:', error);
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
                alert(data.error);
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
                    alert(data.error);
                } else {
                    const watchButton = document.getElementById("watch-button");
                    watchButton.innerHTML = !isWatching ? "★ Unwatch" : "☆ Watch";
                }
            })
            .catch(error => {
                console.error('Error liking thread:', error);
            });
    });

}