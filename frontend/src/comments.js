import { BACKEND_PORT } from './config.js';
import { validateUser } from './main.js';
import { getUserImg, openUserModal, isAdmin, getUserName } from './user.js';
import { formatTimeSince, displayError } from './helpers.js';
import { isThreadLocked, createLikeUser } from './thread-display.js';
import { pollCommentsUpdates } from './polling.js';

let user = null;

if (localStorage.getItem('user') !== null) {
    user = JSON.parse(localStorage.getItem('user'));

}

export const loadComments = (threadId) => {
    fetch(`http://localhost:${BACKEND_PORT}/comments?threadId=${threadId}`, {
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

                const commentsContainer = document.getElementById("comments-container");
                commentsContainer.innerText = "";

                const commentTitle = document.createElement("h3");
                commentTitle.innerText = "Comments";
                commentsContainer.appendChild(commentTitle);

                const commentDisplay = document.createElement("div");
                commentDisplay.id = `comments-container-${threadId}`;
                commentsContainer.appendChild(commentDisplay);


                if (validateUser.pollIntervalId) {
                    clearInterval(validateUser.pollIntervalId);
                    validateUser.pollIntervalId = null;
                }


                validateUser.pollIntervalId = setInterval(() => {
                    pollCommentsUpdates(threadId);
                }, 1000);


                validateUser.commentListCache[threadId] = data;

                data.forEach(comment => {
                    validateUser.commentInfoCache[comment.id] = comment;
                });


                displayComments(data, null);
                validateUser.setCache();

            }
        }).catch(error => {
            validateUser.loadCache();
            const cachedCommentData = validateUser.commentListCache[threadId];
            if (cachedCommentData) {
                displayComments(cachedCommentData, null);
            }
        });
}

export const displayComments = (comments, parentId) => {

    if (comments.length === 0) {
        return;
    }

    const children = comments.filter(comment => comment.parentCommentId === parentId);


    children.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const remaining = comments.filter(comment => comment.parentCommentId !== parentId);


    const processComment = (index) => {
        if (index >= children.length) {
            return;
        }

        const comment = children[index];
        isThreadLocked(comment.threadId).then(isLocked => {
            getUserImg(comment.creatorId).then(profilePictureUrl => {
                isAdmin(validateUser.user.userId).then(isAdmin => {
                    getUserName(comment.creatorId).then(userName => {
                        const parentElement = comment.parentCommentId != null
                            ? document.querySelector(`#comment-${comment.parentCommentId} .nested-comments`) : document.getElementById(`comments-container-${comment.threadId}`);



                        const commentElement = document.createElement("div");
                        commentElement.id = `comment-${comment.id}`;
                        commentElement.className = "comment";

                        const commentHeading = document.createElement("div");
                        commentHeading.className = "comment-heading";


                        const profilePic = document.createElement("img");
                        profilePic.src = profilePictureUrl;
                        profilePic.className = "img-thumbnail profile-pic";
                        profilePic.alt = "Profile Picture";
                        commentHeading.appendChild(profilePic);

                        profilePic.onclick = function () {
                            openUserModal(comment.creatorId);
                        };

                        const nameBlock = document.createElement("div");
                        nameBlock.className = "name-block";

                        const username = document.createElement("a");
                        username.className = "comment-username fs-5";
                        username.innerText = userName;
                        nameBlock.appendChild(username);

                        username.onclick = function () {
                            openUserModal(comment.creatorId);
                        };

                        const metadata = document.createElement("div");
                        metadata.className = "thread-metadata";

                        const time = document.createElement("p");
                        time.className = "text-body-secondary";
                        time.innerText = `${formatTimeSince(comment.createdAt)} | `;

                        metadata.appendChild(time);



                        const likesGroup = document.createElement("div");
                        likesGroup.className = "dropdown";


                        const numLikes = document.createElement("a");
                        numLikes.className = "text-body-secondary";
                        numLikes.innerText = `Likes: ${comment.likes.length}`;

                        likesGroup.appendChild(numLikes);

                        const likesDropdown = document.createElement("ul");
                        likesDropdown.className = "dropdown-menu";

                        likesGroup.appendChild(likesDropdown);

                        if (comment.likes.length === 0) {
                            const noLikesText = document.createElement("div");
                            noLikesText.innerText = "No likes yet.";
                            noLikesText.className = "no-liked-user-link";

                            const noLikes = document.createElement("li");
                            noLikes.appendChild(noLikesText);
                            likesDropdown.appendChild(noLikes);
                        }

                        const likeUserPromises = comment.likes.map(userId => createLikeUser(userId));

                        Promise.all(likeUserPromises).then(likeUsers => {
                            likeUsers.forEach(likeUser => {
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

                        commentHeading.appendChild(nameBlock);

                        const commentBody = document.createElement("div");
                        commentBody.className = "comment-body";

                        // Add comment content
                        const content = document.createElement("p");
                        content.className = "comment-content";
                        content.innerText = comment.content;
                        commentBody.appendChild(content);

                        const contentModify = document.createElement("div");
                        contentModify.className = "btn-group content-modify";

                        // Add number of likes

                        const likeButton = document.createElement("button");
                        likeButton.className = "btn btn-light btn-sm";
                        likeButton.id = `like-comment-${comment.id}`;

                        likeButton.innerHTML = comment.likes.includes(validateUser.user.userId) ? "♥ Unlike" : "♡ Like";
                        likeButton.addEventListener("click", () => {
                            toggleLikeComment(comment.id, comment.threadId);
                        });

                        contentModify.appendChild(likeButton);

                        const replyButton = document.createElement("button");
                        replyButton.innerText = "Reply";
                        replyButton.className = "btn btn-light btn-sm";
                        replyButton.addEventListener("click", () => {
                            openReplyModal(comment.id, comment.threadId);
                        });
                        contentModify.appendChild(replyButton);

                        const editButton = document.createElement("button");
                        editButton.innerText = "Edit";
                        editButton.className = "btn btn-light btn-sm";
                        editButton.style.display = "none";
                        editButton.addEventListener("click", () => {
                            openEditCommentModal(comment.id, comment.content, comment.threadId);
                        });
                        contentModify.appendChild(editButton);

                        if (isAdmin || comment.creatorId === validateUser.user.userId) {
                            editButton.style.display = "block";
                        }

                        if (isLocked) {
                            likeButton.disabled = true;
                            replyButton.disabled = true;
                            editButton.disabled = true;
                        }


                        commentBody.appendChild(contentModify);

                        // Add nested comments container
                        const nestedComments = document.createElement("div");
                        nestedComments.className = "nested-comments";
                        nestedComments.style.paddingLeft = `50px`;

                        const commentBorderLink = document.createElement("a");
                        commentBorderLink.href = `#comment-${comment.id}`;
                        commentBorderLink.className = "comment-border-link";

                        commentElement.appendChild(commentHeading);
                        commentElement.appendChild(commentBody);
                        commentElement.appendChild(nestedComments);
                        commentElement.appendChild(commentBorderLink);

                        parentElement.appendChild(commentElement);

                        displayComments(remaining, comment.id);

                        processComment(index + 1);
                    });
                });
            });
        });
    };

    processComment(0);
};

export const postMainComment = (threadId) => {
    const commentText = document.getElementById("new-comment-text").value;

    if (commentText.trim() === "") {
        displayError("Comment cannot be empty!");
        return;
    }

    const data = {
        "content": commentText,
        "threadId": threadId,
        "parentCommentId": null
    };

    fetch(`http://localhost:${BACKEND_PORT}/comment`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${validateUser.user.token}`
        },
        body: JSON.stringify(data)
    }).then(response => response.json())
        .then(data => {
            if (data.error) {
                displayError(data.error);
            } else {
                if (threadId in validateUser.watchThreads) {
                    validateUser.watchThreads[threadId].add(commentText);
                }
                // loadComments(threadId); // Reload the comments
            }
        });

}

const openReplyModal = (parentId, threadId) => {
    document.getElementById("reply-modal").style.display = "block";

    document.getElementById("reply-comment-submit").onclick = () => {
        replyComment(parentId, threadId);
    };

    document.getElementById("reply-comment-close").onclick = () => {
        document.getElementById("reply-modal").style.display = "none";
    };
    document.getElementById("reply-comment-cross").onclick = () => {
        document.getElementById("reply-modal").style.display = "none";
    };
};

const replyComment = (parentId, threadId) => {
    const commentText = document.getElementById("reply-comment-text").value;

    const data = {
        "content": commentText,
        "threadId": threadId,
        "parentCommentId": parentId
    };

    fetch(`http://localhost:${BACKEND_PORT}/comment`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${validateUser.user.token}`
        },
        body: JSON.stringify(data)
    }).then(response => response.json())
        .then(data => {
            if (data.error) {
                displayError(data.error);
            } else {
                document.getElementById("reply-modal").style.display = "none";
                // loadComments(threadId); // Reload the comments
                if (threadId in validateUser.watchThreads) {
                    validateUser.watchThreads[threadId].add(commentText);
                }
            }
        });
};



const openEditCommentModal = (commentId, commentText, threadId) => {
    document.getElementById("edit-comment-modal").style.display = "block";

    document.getElementById("edit-comment-submit").onclick = () => {
        updateComment(commentId, threadId);
    };

    document.getElementById("edit-comment-text").value = commentText;

    document.getElementById("edit-comment-close").onclick = () => {
        document.getElementById("edit-comment-modal").style.display = "none";
    };

    document.getElementById("edit-comment-cross").onclick = () => {
        document.getElementById("edit-comment-modal").style.display = "none";
    };
};

const updateComment = (commentId, threadId) => {
    const commentText = document.getElementById("edit-comment-text").value;

    const data = {
        "id": commentId,
        "content": commentText
    };

    fetch(`http://localhost:${BACKEND_PORT}/comment`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${validateUser.user.token}`
        },
        body: JSON.stringify(data)
    }).then(response => response.json())
        .then(data => {
            if (data.error) {
                displayError(data.error);
            } else {
                document.getElementById("edit-comment-modal").style.display = "none";
                // loadComments(threadId); // Reload the comments
            }
        });
};

const isCommentLiked = (commentId, threadId) => {
    return fetch(`http://localhost:${BACKEND_PORT}/comments?threadId=${threadId}`, {
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
                const comment = data.find(comment => comment.id === commentId);
                return comment.likes.includes(validateUser.user.userId);
            }
        });
}

const toggleLikeComment = (commentId, threadId) => {
    isCommentLiked(commentId, threadId).then(isLiked => {
        const likeComment = {
            "id": commentId,
            "turnon": !isLiked
        };

        fetch(`http://localhost:${BACKEND_PORT}/comment/like`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${validateUser.user.token}`
            },
            body: JSON.stringify(likeComment)
        })
            .then(response => response.json())
            .then(data => {
                if (data.error) {
                    displayError(data.error);
                } else {
                    const likeButton = document.getElementById(`like-comment-${commentId}`);
                    likeButton.innerHTML = !isLiked ? "♥ Unlike" : "♡ Like";
                    // loadComments(threadId);
                }
            })
            .catch(error => {
                displayError(error);
            });
    });

}