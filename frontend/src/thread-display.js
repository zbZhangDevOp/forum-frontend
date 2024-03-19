import { BACKEND_PORT } from './config.js';
import { loadPage } from './main.js';
import { postMainComment, loadComments } from './comments.js';

import { validateUser } from './main.js';

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

                const title = document.createElement("h1");
                title.innerText = data.title;
                threadDiv.appendChild(title);

                const content = document.createElement("p");
                content.innerText = `Content: ${data.content}`;
                threadDiv.appendChild(content);

                const likes = document.createElement("p");
                likes.innerText = `Likes: ${data.likes}`;
                threadDiv.appendChild(likes);

                const editButton = document.createElement("button");
                editButton.innerText = "Edit";
                editButton.className = "btn btn-primary";
                editButton.addEventListener("click", () => {
                    openEditThreadModal(id);
                });
                threadDiv.appendChild(editButton);


                const deleteButton = document.createElement("button");
                deleteButton.innerText = "Delete";
                deleteButton.className = "btn btn-danger";
                deleteButton.addEventListener("click", () => {
                    deleteThread(id);
                });
                threadDiv.appendChild(deleteButton);

                const likeButton = document.createElement("button");
                likeButton.className = "btn btn-outline-primary";
                likeButton.id = "like-button";
                likeButton.innerHTML = data.likes.includes(validateUser.user.userId) ? "♥ Unlike" : "♡ Like";
                likeButton.addEventListener("click", () => {
                    toggleLikeThread(data.lock, id);
                });

                threadDiv.appendChild(likeButton);


                const watchButton = document.createElement("button");
                watchButton.className = "btn btn-outline-primary";
                watchButton.id = "watch-button";
                watchButton.innerHTML = data.watchees.includes(validateUser.user.userId) ? "❌ Unwatch" : "👁 Watch";
                watchButton.addEventListener("click", () => {
                    toggleWatchThread(id);
                });
                threadDiv.appendChild(watchButton);

                const newCommentText = document.createElement("textarea");
                newCommentText.id = "new-comment-text";
                const newCommentSubmit = document.createElement("button");
                newCommentSubmit.id = "new-comment-submit";
                newCommentSubmit.innerText = "Submit";
                threadDiv.appendChild(newCommentText);
                threadDiv.appendChild(newCommentSubmit);
                newCommentSubmit.addEventListener("click", () => {
                    postMainComment(id);
                });

                const commentDiv = document.createElement("div");
                commentDiv.id = "comments-container";
                threadDiv.appendChild(commentDiv);
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
                    watchButton.innerHTML = !isWatching ? "❌ Unwatch" : "👁 Watch";
                }
            })
            .catch(error => {
                console.error('Error liking thread:', error);
            });
    });

}