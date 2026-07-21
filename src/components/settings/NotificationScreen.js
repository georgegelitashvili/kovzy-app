import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, FlatList, StyleSheet, TouchableOpacity, TouchableWithoutFeedback } from 'react-native';
import { Card, Text } from 'react-native-paper';
import { Audio } from 'expo-av';
import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import useErrorDisplay from '../../hooks/useErrorDisplay';

const musicList = [
    { id: '1', title: 'Plucky', source: require('../../assets/audio/plucky.mp3') },
    { id: '2', title: 'Order', source: require('../../assets/audio/order.mp3') },
    { id: '3', title: 'Definite', source: require('../../assets/audio/definite-555.mp3') },
    { id: '4', title: 'Joyous chime', source: require('../../assets/audio/joyous-chime-notification.mp3') },
    { id: '5', title: 'Light hearted tone', source: require('../../assets/audio/light-hearted-message-tone.mp3') },
    { id: '6', title: 'Notification pretty good', source: require('../../assets/audio/notification-pretty-good.mp3') },
    { id: '7', title: 'Pristine', source: require('../../assets/audio/pristine-609.mp3') },
    { id: '8', title: 'Relax tone', source: require('../../assets/audio/relax-message-tone.mp3') },
];

const NotificationScreen = () => {
    const soundRef = useRef(null);
    const [playingMusicId, setPlayingMusicId] = useState(null);
    const [selectedMusic, setSelectedMusic] = useState(null);
    const [pressedCardId, setPressedCardId] = useState(null);
    const { errorDisplay, setError, clearError } = useErrorDisplay({ showInline: true, style: styles.errorDisplay });

    useEffect(() => {
        const loadSavedMusic = async () => {
            try {
                const savedMusicId = await AsyncStorage.getItem('selectedMusicId');
                if (savedMusicId) {
                    setSelectedMusic(savedMusicId);
                    setPlayingMusicId(savedMusicId);
                } else {
                    setSelectedMusic('1');
                    setPlayingMusicId('1');
                }
            } catch (error) {
                console.log('Error loading saved music:', error);
                setError('STORAGE_ERROR', 'Failed to load notification preferences');
            }
        };
        loadSavedMusic();
    }, []);

    useEffect(() => {
        return () => {
            if (soundRef.current) {
                soundRef.current.unloadAsync().catch(() => { });
                soundRef.current = null;
            }
        };
    }, []);

    useFocusEffect(
        useCallback(() => {
            return () => {
                if (soundRef.current) {
                    soundRef.current.getStatusAsync()
                        .then(status => {
                            if (status.isLoaded) {
                                soundRef.current.stopAsync().catch(() => { });
                            }
                        })
                        .catch(() => { });
                    setPlayingMusicId(null);
                }
            };
        }, [])
    );

    const onPlaySound = async (musicId, source) => {
        try {
            if (soundRef.current) {
                const status = await soundRef.current.getStatusAsync();
                if (status.isLoaded) {
                    await soundRef.current.stopAsync();
                    await soundRef.current.unloadAsync();
                }
                soundRef.current = null;
            }

            if (playingMusicId === musicId) {
                setPlayingMusicId(null);
                return;
            }

            const { sound: newSound } = await Audio.Sound.createAsync(source);
            soundRef.current = newSound;
            setPlayingMusicId(musicId);

            await newSound.playAsync();

            newSound.setOnPlaybackStatusUpdate((status) => {
                if (status.didJustFinish) {
                    setPlayingMusicId(null);
                }
            });
        } catch (error) {
            console.log('Error playing sound:', error);
            setError('AUDIO_ERROR', 'Failed to play the sound');
        }
    };

    const onSelectMusic = async (id, title) => {
        setSelectedMusic(id);
        try {
            await AsyncStorage.setItem('selectedMusicId', id);
            await AsyncStorage.setItem('selectedMusicTitle', title);
            clearError();
        } catch (error) {
            console.log('Error saving selected music:', error);
            setError('STORAGE_ERROR', 'Failed to save notification preferences');
        }
    };

    const handleCardPress = (item) => {
        onSelectMusic(item.id, item.title);
        onPlaySound(item.id, item.source);
    };

    const handleOutsidePress = async () => {
        if (soundRef.current) {
            try {
                const status = await soundRef.current.getStatusAsync();
                if (status.isLoaded) {
                    await soundRef.current.stopAsync();
                }
                setPlayingMusicId(null);
            } catch (error) {
                console.log('Error stopping sound on outside press:', error);
            }
        }
    };

    const handlePressIn = (id) => {
        setPressedCardId(id);
    };

    const handlePressOut = () => {
        setPressedCardId(null);
    };

    return (
        <TouchableWithoutFeedback onPress={handleOutsidePress}>
            <View style={styles.container}>
                {errorDisplay}
                <FlatList
                    data={musicList}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            onPressIn={() => handlePressIn(item.id)}
                            onPressOut={handlePressOut}
                            onPress={() => handleCardPress(item)}
                        >
                            <Card
                                style={[
                                    styles.card,
                                    pressedCardId === item.id ? styles.cardPressed : {}
                                ]}
                            >
                                <Card.Content style={styles.cardContent}>
                                    <View style={styles.titleContainer}>
                                        <Text style={styles.title}>{item.title}</Text>
                                        <View style={styles.checkboxContainer}>
                                            {selectedMusic === item.id && (
                                                <Feather name="check" size={24} color="#007AFF" />
                                            )}
                                        </View>
                                    </View>
                                </Card.Content>
                            </Card>
                        </TouchableOpacity>
                    )}
                    contentContainerStyle={styles.list}
                />
            </View>
        </TouchableWithoutFeedback>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F5F5',
    },
    list: {
        paddingHorizontal: 15,
        paddingVertical: 10,
    },
    card: {
        marginBottom: 10,
        borderRadius: 8,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    cardPressed: {
        elevation: 1,
        shadowOpacity: 0.05,
    },
    cardContent: {
        paddingVertical: 10,
        paddingHorizontal: 15,
    },
    titleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    title: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333333',
        flex: 1,
    },
    checkboxContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        height: 24,
        width: 24,
    },
    errorDisplay: {
        zIndex: 1000,
        width: '92%',
        alignSelf: 'center',
    },
});

export default NotificationScreen;
