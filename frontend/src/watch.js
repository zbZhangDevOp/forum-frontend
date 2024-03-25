import { BACKEND_PORT } from './config.js';
import { validateUser } from './main.js';

import { fetchUserThreads } from './user.js';

let user = null;

if (localStorage.getItem('user') !== null) {
    user = JSON.parse(localStorage.getItem('user'));

}

export const fetchThreadsUserIsWatching = (userId) => {
    fetchUserThreads().then(allThreads => {
        allThreads.filter(thread => thread.creatorId === userId)

        const threadPromises = allThreads.map(threadId => addWatchThread(threadId));

        Promise.all(threadPromises).then(() => {
        });
    });
}

const addWatchThread = (threadId) => {
    return fetch(`${BACKEND_PORT}/thread?id=${threadId}`, {
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
                for (let i = 0; i < data.watchees.length; i++) {
                    if (data.watchees[i] === validateUser.user.userId) {
                        validateUser.watchThreads[threadId] = new Set();
                        fetchCommentsForThread(threadId);
                    }
                }
            }
        });
}


export const fetchCommentsForThread = (threadId) => {
    fetch(`${BACKEND_PORT}/comments?threadId=${threadId}`, {
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
                for (let i = 0; i < data.length; i++) {
                    validateUser.watchThreads[threadId].add(data[i].id);
                }
            }
        });
}

export const fetchNewCommentsForThread = (threadId) => {
    fetch(`${BACKEND_PORT}/comments?threadId=${threadId}`, {
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
                const newComments = [];
                for (let i = 0; i < data.length; i++) {
                    newComments.push(data[i].id);
                }

                let difference = newComments.filter(comment => !validateUser.watchThreads[threadId].has(comment));

                difference.forEach(comment => {
                    validateUser.watchThreads[threadId].add(comment);

                    const title = `New comment in watched thread`;
                    const options = {
                        body: `Thread ID: ${threadId}`,
                    };
                    if (Notification.permission === 'granted') {
                        new Notification(title, options);
                    }
                });
            }
        });
}

export const pollForNewComments = () => {
    Object.entries(validateUser.watchThreads).forEach(([key, thread]) => {
        fetchNewCommentsForThread(key);
    });

}