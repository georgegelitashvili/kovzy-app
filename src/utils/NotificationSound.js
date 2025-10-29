import React, { useEffect, useContext, useRef, useImperativeHandle, forwardRef } from 'react';
import { View, AppState, Alert } from 'react-native';
import { Audio } from 'expo-av';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { String, LanguageContext } from '../components/Language';
import * as Sentry from '@sentry/react-native';

const musicList = [
    { id: '1', title: 'Plucky', source: require('../assets/audio/plucky.mp3') },
    { id: '2', title: 'Order', source: require('../assets/audio/order.mp3') },
    { id: '3', title: 'Definite', source: require('../assets/audio/definite-555.mp3') },
    { id: '4', title: 'Joyous chime', source: require('../assets/audio/joyous-chime-notification.mp3') },
    { id: '5', title: 'Light hearted tone', source: require('../assets/audio/light-hearted-message-tone.mp3') },
    { id: '6', title: 'Notification pretty good', source: require('../assets/audio/notification-pretty-good.mp3') },
    { id: '7', title: 'Pristine', source: require('../assets/audio/pristine-609.mp3') },
    { id: '8', title: 'Relax tone', source: require('../assets/audio/relax-message-tone.mp3') },
];

const NotificationSound = forwardRef((props, ref) => {
    const { dictionary } = useContext(LanguageContext);
    const soundRef = useRef(null);
    const repeatIntervalRef = useRef(null);
    const appState = useRef(AppState.currentState);
    const isSoundPlaying = useRef(false); // Track if a sound is currently playing

    useEffect(() => {
        const subscription = AppState.addEventListener('change', nextAppState => {
            if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
                // App has come to foreground
                onStopPlaySound();
            }
            appState.current = nextAppState;
        });

        return () => {
            subscription.remove();
            // Cleanup sound on unmount
            onStopPlaySound();
        };
    }, []);

    const onStopPlaySound = async () => {
        try {
            if (soundRef.current) {
                await soundRef.current.stopAsync();
                await soundRef.current.unloadAsync();
                soundRef.current = null;
            }
            if (repeatIntervalRef.current) {
                clearInterval(repeatIntervalRef.current);
                repeatIntervalRef.current = null;
            }
            isSoundPlaying.current = false;
            console.log('🔈 Notification sound stopped and unloaded');
        } catch (error) {
            isSoundPlaying.current = false;
            console.log('Audio stop error (suppressed):', error);
            Sentry.captureException(error);
        }
    };

    const onPlaySound = async (repeat = false, selectedSound = '1', volume = 1.0) => {
        try {
            if (isSoundPlaying.current) {
                console.log('🔈 Sound already playing, skipping new sound');
                return;
            }

            await onStopPlaySound();

            const music = musicList.find(m => m.id === selectedSound) || musicList[0];
            const { sound } = await Audio.Sound.createAsync(
                music.source,
                { volume, shouldPlay: true }
            );

            soundRef.current = sound;
            isSoundPlaying.current = true;

            // Add timeout to stop sound after 10 seconds
            const timeout = setTimeout(async () => {
                await onStopPlaySound();
                console.log('🔈 Sound stopped due to timeout');
            }, 10000);

            if (repeat) {
                sound.setOnPlaybackStatusUpdate(async status => {
                    if (status.didJustFinish && isSoundPlaying.current) {
                        try {
                            await sound.replayAsync();
                            console.log('🔈 Sound replayed');
                        } catch (error) {
                            isSoundPlaying.current = false;
                            console.log('Audio replay error (suppressed):', error);
                            Sentry.captureException(error);
                        }
                    }
                });
            }

            sound.setOnPlaybackStatusUpdate(status => {
                if (status.didJustFinish && !repeat) {
                    isSoundPlaying.current = false;
                    console.log('🔈 Sound playback finished naturally');
                    clearTimeout(timeout);
                }
            });

            console.log('🔈 Playing notification sound:', music.title);
        } catch (error) {
            isSoundPlaying.current = false;
            console.log('Audio play error (suppressed):', error);
            Sentry.captureException(error);
        }
    };

    const loadAndPlaySavedMusic = async () => {
        try {
            const savedMusicId = await AsyncStorage.getItem('selectedMusicId');
            const repeat = (await AsyncStorage.getItem('repeatSound')) === 'true';
            const volume = parseFloat(await AsyncStorage.getItem('soundVolume')) || 1.0;
            await onPlaySound(repeat, savedMusicId || '1', volume);
        } catch (error) {
            console.log('Error loading saved music:', error);
            Sentry.captureException(error);
            // Fallback to default sound
            await onPlaySound(false, '1', 1.0);
        }
    };

    const orderReceived = async () => {
        await loadAndPlaySavedMusic();
        Alert.alert(
            dictionary?.['general.alerts'] || 'შეტყობინება',
            dictionary?.['orders.orderReceivedTitle'] || 'ახალი შეკვეთა მიღებულია',
            [
                {
                    text: dictionary?.['okay'] || 'კარგი',
                    onPress: async () => {
                        await onStopPlaySound();
                        console.log('🔈 Stopped sound on alert dismissal');
                    },
                },
            ],
            { cancelable: false }
        );
    };

    useImperativeHandle(ref, () => ({
        playSound: async (options = {}) => {
            const { repeat = false, selectedSound = '1', volume = 1.0 } = options;
            await onPlaySound(repeat, selectedSound, volume);
        },
        stopSound: async () => {
            await onStopPlaySound();
        },
        orderReceived,
    }));

    return <View />;
});

export default NotificationSound;