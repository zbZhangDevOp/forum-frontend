import { BACKEND_PORT } from './config.js';
import { validateUser } from './main.js';

import { displayComments } from './comments.js';

let user = null;

if (localStorage.getItem('user') !== null) {
    user = JSON.parse(localStorage.getItem('user'));

}

export const pollThreadUpdates = (threadId) => {
    fetch(`http://localhost:${BACKEND_PORT}/thread?id=${threadId}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${validateUser.user.token}`
        }
    })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                console.error('Failed to fetch thread updates:', data.error);
            } else {
                updateThreadUI(data, threadId); // Update your UI with the new data
            }
        })
        .catch(error => console.error('Error polling thread updates:', error));
}

export const pollCommentsUpdates = (threadId) => {
    fetch(`http://localhost:${BACKEND_PORT}/comments?threadId=${threadId}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${validateUser.user.token}`
        }
    })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                console.error('Failed to fetch thread updates:', data.error);
            } else {
                updateCommentUI(data, threadId); // Update your UI with the new data
            }
        })
        .catch(error => console.error('Error polling thread updates:', error));
}


const updateThreadUI = (threadData, threadId) => {
    const menuLikesElement = document.getElementById(`menu-likes-${threadId}`);
    if (menuLikesElement) {
        menuLikesElement.innerText = `Likes: ${threadData.likes.length}`;
    }

    const threadLikesElement = document.getElementById(`thread-likes-${threadId}`);
    if (threadLikesElement) {
        threadLikesElement.innerText = `Likes: ${threadData.likes.length}`;
    }

}

const updateCommentUI = (threadData, threadId) => {
    const commentContainer = document.getElementById(`comments-container-${threadId}`);

    validateUser.loadCache();
    const cachedCommentData = validateUser.commentListCache[threadId];

    if (commentContainer && !objectsAreEqual(threadData, cachedCommentData)) {
        commentContainer.innerText = "";
        displayComments(threadData, null)
        validateUser.commentListCache[threadId] = threadData;
        validateUser.setCache();
    }

}

function objectsAreEqual(obj1, obj2) {
    const keys1 = Object.keys(obj1);
    const keys2 = Object.keys(obj2);

    if (keys1.length !== keys2.length) {
        return false;
    }

    for (const key of keys1) {
        const val1 = obj1[key];
        const val2 = obj2[key];

        const areObjects = isObject(val1) && isObject(val2);
        if (
            (areObjects && !objectsAreEqual(val1, val2)) ||
            (!areObjects && val1 !== val2)
        ) {
            return false;
        }
    }

    return true;
}

function isObject(object) {
    return object != null && typeof object === 'object';
}