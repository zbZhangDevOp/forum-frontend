import { BACKEND_PORT } from './config.js';
import { displayThread } from './thread-display.js';


let user = null;

if (localStorage.getItem('user') !== null) {
    user = JSON.parse(localStorage.getItem('user'));

}

export const loadComments = (threadId) => {
    fetch(`http://localhost:${BACKEND_PORT}/comments?threadId=${threadId}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${user.token}`
        }
    }).then(response => response.json())
        .then(data => {
            if (data.error) {
                alert(data.error);
            } else {
                document.getElementById("comments-container").innerText = "";
                console.log(data);
                displayComments(data, null);
            }
        });
}

const displayComments = (comments, parentId) => {
    if (comments.length === 0) {
        return;
    }

    const children = comments.filter(comment => comment.parentCommentId === parentId);
    const remaining = comments.filter(comment => comment.parentCommentId !== parentId);

    children.forEach(comment => {

        const parentElement = comment.parentCommentId != null
            ? document.querySelector(`#comment-${comment.parentCommentId} .nested-comments`) : document.getElementById("comments-container");


        console.log(comment.id)
        console.log(comment.parentCommentId)

        const commentElement = document.createElement("div");
        commentElement.className = "comment";

        // Add comment content
        const content = document.createElement("p");
        content.innerText = comment.content;
        commentElement.appendChild(content);

        const creator = document.createElement("p");
        creator.innerText = comment.creatorId;
        commentElement.appendChild(creator);

        // Add user profile picture
        // const profilePic = document.createElement("img");
        // profilePic.src = comment.userProfilePic;
        // profilePic.alt = "Profile Picture";
        // commentElement.appendChild(profilePic);

        // Add time since commented
        const timeSince = document.createElement("p");
        timeSince.innerText = comment.createdAt;
        // timeSince.innerText = formatTimeSince(comment.createdAt);
        commentElement.appendChild(timeSince);

        // Add number of likes
        const likes = document.createElement("p");
        likes.innerText = `Likes: ${comment.likes}`;
        commentElement.appendChild(likes);

        const replyButton = document.createElement("button");
        replyButton.innerText = "Reply";
        replyButton.className = "btn btn-reply";
        replyButton.addEventListener("click", () => {
            openReplyModal(comment.id, comment.threadId);
        });
        commentElement.appendChild(replyButton);

        // Add nested comments container
        const nestedComments = document.createElement("ul");
        nestedComments.className = "nested-comments";
        nestedComments.style.paddingLeft = `50px`;

        const list = document.createElement("li");
        list.id = `comment-${comment.id}`;
        list.appendChild(commentElement);
        list.appendChild(nestedComments);

        parentElement.appendChild(list);

        displayComments(remaining, comment.id);
    });
};

export const postMainComment = (threadId) => {
    const commentText = document.getElementById("new-comment-text").value;

    if (commentText.trim() === "") {
        alert("Comment cannot be empty!");
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
            'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify(data)
    }).then(response => response.json())
        .then(data => {
            if (data.error) {
                alert(data.error);
            } else {
                console.log(data.id)
                loadComments(threadId); // Reload the comments
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
            'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify(data)
    }).then(response => response.json())
        .then(data => {
            if (data.error) {
                alert(data.error);
            } else {
                console.log(data.id)
                document.getElementById("reply-modal").style.display = "none";
                loadComments(threadId); // Reload the comments
            }
        });
};