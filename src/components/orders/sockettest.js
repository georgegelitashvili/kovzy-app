import React, {
    createContext,
    useContext,
    ReactNode,
    useEffect,
    useState,
} from 'react';
import { io } from 'socket.io-client';
import { useKovzyOrdersContext } from './KovzyOrdersContext';
import { environment } from '../environment/environment';
import useUserStore from '@store/user/userStore';
import useBranchStore from '@store/branch/branchStore';

interface SocketProviderProps {
    children: ReactNode;
}

interface SocketContextValue {
    socket?: any;
}

interface SocketContextValue { }

const SocketContext = createContext < SocketContextValue | undefined > (undefined);

export const SocketProvider: React.FC<SocketProviderProps> = ({ children }) => {
    const { user } = useUserStore();
    const { setKovzyOrders } = useKovzyOrdersContext();
    const [socket, setSocket] = useState < any | undefined > (undefined);
    const { branch } = useBranchStore();

    useEffect(() => {
        if (user?.token && !socket && branch) {
            // console.info('found token', user?.token);
            const newSocket = io(environment.webSocketPath + '/kovzy-point-of-sale', {
                auth: {
                    token: user.token,
                },
                query: {
                    branch: branch?.id,
                },
            });

            newSocket.on('connect', () => {
                console.log('socket connected');
                console.log(newSocket.connected, 'newSocket.connected'); // true
            });

            newSocket.on('connect_error', error => {
                console.info('connect_error');
                console.info(error);
            });

            newSocket.on('kovzy-order', data => {
                console.info('kovzy-order');
                console.info(data);

                // Convert order items
                const convertedOrderItems = data.order_items.map((orderItem: any) => ({
                    id: orderItem.product.id,
                    name_default: orderItem.product.name_default,
                    name_secondary: orderItem.product.name_secondary,
                    price: parseFloat(orderItem.price) * 100, // Use orderItem.price directly
                    quantity: orderItem.quantity,
                }));

                // Modify data object
                const modifiedData = {
                    ...data,
                    products: convertedOrderItems,
                };

                // Update kovzyOrders state by prepending the modified data
                setKovzyOrders(orders => [modifiedData, ...orders]);
            });

            newSocket.on('kovzy-order-update', data => {
                if (data.cashier !== user.id) {
                    console.log('changed from other plansheet');
                    setKovzyOrders(kovzyOrders => {
                        return kovzyOrders.map(item => {
                            if (item.id === data.orderId) {
                                return { ...item, kovzy_status: data.status };
                            } else return item;
                        });
                    });
                }
            });

            setSocket(newSocket);
        } else {
            console.info('not found token or socket already exists');
        }
        if (!branch && socket) {
            socket.disconnect();
        }

        return () => {
            if (socket) {
                socket.disconnect();
                setSocket(undefined);
            }
        };
    }, [user, socket, branch]);

    return <SocketContext.Provider value={{}}>{children}</SocketContext.Provider>;
};

export const useSocketContext = () => {
    const context = useContext(SocketContext);
    // if (!context) {
    //   throw new Error('useActiveOrdersContext must be used within an ActiveOrdersProvider');
    // }
    return context;
};