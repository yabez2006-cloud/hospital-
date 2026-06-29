import { useEffect } from 'react';
import { getSocket } from '../utils/socket';

export default function useNotifications() {
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    const handler = (payload) => {
      const el = document.getElementById('notifications');
      if (el) {
        const div = document.createElement('div');
        div.className = 'notification';
        div.textContent = payload.message || JSON.stringify(payload);
        el.prepend(div);
        setTimeout(() => div.remove(), 10000);
      }
    };
    socket.on('notification', handler);
    return () => { socket.off('notification', handler); };
  }, []);
}
