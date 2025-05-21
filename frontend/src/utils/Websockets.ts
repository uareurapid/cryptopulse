const url = process.env.REACT_APP_BACKEND_WEBSOCKETS_URL as string || 'ws://localhost:3030'
// Create WebSocket connection.
const socket = new WebSocket(url);

const START_SESSION_MESSAGE = 'start_session';
export function startWebsockets() {
    console.log('start webscokets on url: ', url)

    console.log('websocket client side is: ', socket)
    // Connection opened
    socket.addEventListener("open", (event) => {
        socket.send(START_SESSION_MESSAGE);
    });
  
    // Listen for messages
    socket.addEventListener("message", (event) => {
        console.log("Message from server ", event.data);
    });
}



