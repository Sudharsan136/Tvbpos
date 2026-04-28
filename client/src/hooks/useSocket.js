import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import useTableStore from '../store/tableStore';

let socketInstance = null;

const useSocket = (room = null) => {
  const socketRef = useRef(null);
  const updateTableStatus = useTableStore((s) => s.updateTableStatus);

  useEffect(() => {
    // Singleton socket connection
    if (!socketInstance) {
      socketInstance = io('http://localhost:5000', {
        withCredentials: true,
        transports: ['websocket'],
      });
    }
    socketRef.current = socketInstance;

    const socket = socketRef.current;

    // Join room if specified
    if (room) {
      socket.emit('join_room', room);
    }

    // Listen for table status changes globally
    socket.on('table_status_changed', ({ tableId, status }) => {
      updateTableStatus(tableId, status);
    });

    return () => {
      socket.off('table_status_changed');
    };
  }, [room]);

  return socketRef.current;
};

export default useSocket;
