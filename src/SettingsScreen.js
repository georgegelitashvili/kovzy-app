// screens/SettingsScreen.js
import React, { useState, useEffect, useContext, useRef } from 'react';
import {
    StyleSheet,
    SafeAreaView,
    View,
    ScrollView,
    Text,
    TouchableOpacity,
    Switch,
    Modal,
} from 'react-native';
import FeatherIcon from 'react-native-vector-icons/Feather';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LanguageContext } from "./components/Language";
import { AuthContext } from "./context/AuthProvider";
import axiosInstance from "./apiConfig/apiRequests";
import eventEmitter from "./utils/EventEmitter";

const SettingsScreen = ({ navigation }) => {
    const { domain, setDeliveronEnabled, deliveronEnabled } = useContext(AuthContext);
    const { dictionary } = useContext(LanguageContext);
    const [postponeOrderShow, setPostponeOrderShow] = useState(false);
    const [postponeOrderLoaded, setPostponeOrderLoaded] = useState(false);
    const [musicTitle, setMusicTitle] = useState('');
    const [modalVisible, setModalVisible] = useState(false);
    const [options, setOptions] = useState({
        url_deliveronStatus: "",
        url_deliveronActivity: "",
    });
    const [togglingDeliveron, setTogglingDeliveron] = useState(false);
    const togglingDeliveronRef = useRef(false);

    const loadMusicTitle = async () => {
        try {
            const title = await AsyncStorage.getItem('selectedMusicTitle');
            if (title) {
                setMusicTitle(title);
            } else {
                setMusicTitle('Plucky');
            }
        } catch (error) {
            console.log('Error loading music title:', error);
        }
    };

    const apiOptions = () => {
        setOptions({
          url_deliveronStatus: `https://${domain}/api/v1/admin/deliveronStatus`,
          url_deliveronActivity: `https://${domain}/api/v1/admin/deliveronActivity`,
        });
    };

    useEffect(() => {
        let active = true;
        const loadPostponeOrder = async () => {
            try {
                const storedValue = await AsyncStorage.getItem('postponeOrderShow');
                if (!active) return;
                if (storedValue !== null) {
                    setPostponeOrderShow(JSON.parse(storedValue));
                }
            } catch (error) {
                console.error('Failed to load stored value', error);
            } finally {
                if (active) setPostponeOrderLoaded(true);
            }
        };

        loadPostponeOrder();
        return () => {
            active = false;
        };
    }, []);

    useEffect(() => {
        // Don't persist the initial default `false` before AsyncStorage has loaded
        if (!postponeOrderLoaded) return;

        const savePostponeOrder = async () => {
            try {
                await AsyncStorage.setItem('postponeOrderShow', JSON.stringify(postponeOrderShow));
            } catch (error) {
                console.error('Failed to save value', error);
            }
        };

        savePostponeOrder();
    }, [postponeOrderShow, postponeOrderLoaded]);

    const togglePostponeOrder = (nextValue) => {
        setPostponeOrderShow(
            typeof nextValue === 'boolean' ? nextValue : (prev) => !prev
        );
    };

    const showDeliveronToast = (type, title, subtitle = '') => {
        eventEmitter.emit('showToast', {
            type,
            title,
            subtitle,
            duration: 4500,
        });
    };
    
    const toggleDeliveron = (nextEnabled) => {
        if (togglingDeliveronRef.current || togglingDeliveron || !options.url_deliveronActivity) return;

        const enabling =
            typeof nextEnabled === 'boolean' ? nextEnabled : !deliveronEnabled;

        if (!enabling) {
            setModalVisible(true);
        } else {
            handleConfirmToggle(true);
        }
    };

    const handleConfirmToggle = async (newValue) => {
        // Guard before closing the modal so a busy/missing-URL state does not
        // dismiss the confirmation without sending the disable request.
        // Ref blocks concurrent callers before React re-renders togglingDeliveron.
        if (togglingDeliveronRef.current || togglingDeliveron || !options.url_deliveronActivity) {
            return;
        }

        togglingDeliveronRef.current = true;
        setModalVisible(false);
        setTogglingDeliveron(true);

        try {
            const response = await axiosInstance.post(options.url_deliveronActivity, {
                enabled: newValue,
            });

            const payload = response?.data?.data ?? response?.data;
            const errorCode =
              typeof payload?.error === 'string'
                ? payload.error
                : payload?.error?.code;
            if (
              newValue &&
              (errorCode === 'DELIVERON_NOT_INTEGRATED' || payload?.integrated === false)
            ) {
                setDeliveronEnabled(false);
                showDeliveronToast(
                    'failed',
                    dictionary['dv.needIntegration'] || 'Deliveron integration required',
                    dictionary['dv.needIntegrationHint'] || 'Connect Deliveron in the admin panel, then try again.'
                );
                return;
            }

            if (typeof payload?.enabled === 'boolean') {
                setDeliveronEnabled(payload.enabled);
            } else if (errorCode || payload?.integrated === false) {
                // Ambiguous success payload: keep prior UI state rather than guessing.
                showDeliveronToast(
                    'failed',
                    dictionary['general.alerts'] || 'Alert',
                    dictionary['errors.generic'] || 'Something went wrong. Please try again.'
                );
            } else {
                setDeliveronEnabled(Boolean(newValue));
            }
        } catch (error) {
            // Axios interceptor replaces the raw error with a formatted object.
            const statusCode = error?.statusCode || error?.response?.status || error?.originalError?.response?.status;
            const errorPayload = error?.data || error?.response?.data || error?.originalError?.response?.data;
            const code =
                error?.code ||
                (typeof errorPayload?.error === 'string' ? errorPayload.error : errorPayload?.error?.code) ||
                error?.type;
            const integrated = errorPayload?.integrated;

            if (__DEV__) {
                console.log('[Deliveron toggle] caught error', {
                    statusCode,
                    code,
                    integrated,
                    type: error?.type,
                    message: error?.message,
                    data: errorPayload,
                });
            }

            const isMissingIntegration =
                newValue &&
                (code === 'DELIVERON_NOT_INTEGRATED' ||
                    integrated === false ||
                    statusCode === 422);

            if (isMissingIntegration) {
                showDeliveronToast(
                    'failed',
                    dictionary['dv.needIntegration'] || 'Deliveron integration required',
                    dictionary['dv.needIntegrationHint'] || 'Connect Deliveron in the admin panel, then try again.'
                );
            } else {
                console.error("Error toggling deliveron:", error);
                showDeliveronToast(
                    'failed',
                    dictionary['general.alerts'] || 'Alert',
                    dictionary['errors.generic'] || 'Something went wrong. Please try again.'
                );
            }
        } finally {
            togglingDeliveronRef.current = false;
            setTogglingDeliveron(false);
        }
    };

    useEffect(() => {
        loadMusicTitle();

        const unsubscribe = navigation.addListener('focus', () => {
            loadMusicTitle();
        });

        return unsubscribe;
    }, [navigation]);

    useEffect(() => {
        if (domain) {
          apiOptions();
        }
      }, [domain]);

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#f6f6f6' }}>
            <View style={styles.container}>
                <ScrollView>
                    <View style={styles.section}>
                        <View style={styles.section}>
                            <View style={styles.sectionBody}>
                                <View style={styles.rowWrapper}>
                                    <TouchableOpacity
                                        onPress={() => navigation.navigate('MusicList')}
                                        style={styles.row}>
                                        <View
                                            style={[styles.rowIcon, { backgroundColor: '#FE3C30' }]}>
                                            <FeatherIcon
                                                color="#fff"
                                                name="music"
                                                size={20} />
                                        </View>

                                        <Text style={styles.rowLabel}>{dictionary['sound']}</Text>

                                        <View style={styles.rowSpacer} />

                                        <Text style={styles.rowValue}>{musicTitle}</Text>

                                        <FeatherIcon
                                            color="#C6C6C6"
                                            name="chevron-right"
                                            size={20} />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>
                        <View style={[styles.section, styles.sectionContainer]}>
                            <View style={[styles.row, styles.rowWrapper]}>
                                <TouchableOpacity
                                    style={styles.rowLabelPressable}
                                    onPress={() => toggleDeliveron(!deliveronEnabled)}
                                    disabled={togglingDeliveron || !options.url_deliveronActivity}
                                >
                                    <Text style={styles.rowLabel}>{dictionary["dv.deliveron"]}</Text>
                                </TouchableOpacity>
                                <Switch
                                    style={styles.switch}
                                    value={deliveronEnabled}
                                    onValueChange={toggleDeliveron}
                                    disabled={togglingDeliveron || !options.url_deliveronActivity}
                                />
                            </View>
                        </View>
                        <View style={[styles.section, styles.sectionContainer]}>
                            <View style={[styles.row, styles.rowWrapper]}>
                                <TouchableOpacity
                                    style={styles.rowLabelPressable}
                                    onPress={() => togglePostponeOrder(!postponeOrderShow)}
                                >
                                    <Text style={styles.rowLabel}>{dictionary["st.postponeOrder"]}</Text>
                                </TouchableOpacity>
                                <Switch
                                    style={styles.switch}
                                    value={postponeOrderShow}
                                    onValueChange={togglePostponeOrder}
                                />
                            </View>
                        </View>
                        <Modal
                            transparent={true}
                            animationType="slide"
                            visible={modalVisible}
                            onRequestClose={() => setModalVisible(false)}
                        >
                            <View style={styles.modalOverlay}>
                                <View style={styles.modalContent}>
                                    <View style={styles.textContainer}>
                                        <Text style={styles.modalText}>
                                            {dictionary["dv.deliveronOff"]}
                                        </Text>
                                    </View>
                                    <View style={styles.buttonContainer}>
                                        <TouchableOpacity
                                            style={styles.cancelButton}
                                            onPress={() => setModalVisible(false)}
                                        >
                                            <Text style={styles.buttonText}>{dictionary['cancel']}</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={styles.confirmButton}
                                            onPress={() => handleConfirmToggle(!deliveronEnabled)}
                                        >
                                            <Text style={styles.buttonText}>{dictionary['confirm']}</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </View>
                        </Modal>
                    </View>

                </ScrollView>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    sectionContainer: {
        padding: 20,
        paddingBottom: 1,
        paddingTop: 1,
        paddingEnd: 1,
        marginVertical: 10,
        backgroundColor: '#fff',  
        borderRadius: 8,          
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,           
    },
    container: {
        paddingVertical: 24,
        paddingHorizontal: 0,
        flexGrow: 1,
        flexShrink: 1,
        flexBasis: 0,
    },
    contentFooter: {
        marginTop: 24,
        fontSize: 13,
        fontWeight: '500',
        color: '#929292',
        textAlign: 'center',
    },
    header: {
        paddingHorizontal: 24,
        marginBottom: 12,
    },
    headerTitle: {
        fontSize: 32,
        fontWeight: '700',
        color: '#1d1d1d',
    },
    headerSubtitle: {
        fontSize: 15,
        fontWeight: '500',
        color: '#929292',
        marginTop: 6,
    },
    profile: {
        padding: 16,
        flexDirection: 'column',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderColor: '#e3e3e3',
    },
    profileAvatar: {
        width: 60,
        height: 60,
        borderRadius: 9999,
    },
    profileName: {
        marginTop: 12,
        fontSize: 20,
        fontWeight: '600',
        color: '#090909',
    },
    profileEmail: {
        marginTop: 6,
        fontSize: 16,
        fontWeight: '400',
        color: '#848484',
    },
    profileAction: {
        marginTop: 12,
        paddingVertical: 10,
        paddingHorizontal: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#007bff',
        borderRadius: 12,
    },
    profileActionText: {
        marginRight: 8,
        fontSize: 15,
        fontWeight: '600',
        color: '#fff',
    },
    section: {
        paddingTop: 12,
    },
    sectionTitle: {
        marginVertical: 8,
        marginHorizontal: 24,
        fontSize: 14,
        fontWeight: '600',
        color: '#a7a7a7',
        textTransform: 'uppercase',
        letterSpacing: 1.2,
    },
    sectionBody: {
        paddingLeft: 24,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderColor: '#e3e3e3',
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingRight: 16,
        height: 50,
    },
    rowWrapper: {
        borderTopWidth: 1,
        borderColor: '#e3e3e3',
    },
    rowFirst: {
        borderTopWidth: 0,
    },
    rowIcon: {
        width: 30,
        height: 30,
        borderRadius: 4,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    rowLabel: {
        fontSize: 17,
        fontWeight: '500',
        color: '#000',
    },
    rowLabelPressable: {
        flex: 1,
        justifyContent: 'center',
        height: '100%',
    },
    rowSpacer: {
        flexGrow: 1,
        flexShrink: 1,
        flexBasis: 0,
    },
    rowValue: {
        fontSize: 17,
        fontWeight: '500',
        color: '#8B8B8B',
        marginRight: 4,
    },
    modalOverlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)', 
    },
    modalContent: {
        width: '80%',
        backgroundColor: 'white',
        borderRadius: 10,
        padding: 20,
        elevation: 5,
        shadowOpacity: 0.25,
        shadowRadius: 4,
    },
    textContainer: {
        alignSelf: 'flex-start',
        marginBottom: 15,
    },
    modalText: {
        marginBottom: 25,
        marginTop: 10,
        fontSize: 18,
        color: 'rgb(255, 0, 0)',
        fontWeight: 'bold',
        textAlign: 'justify',
        maxWidth: '100%',
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    cancelButton: {
        flex: 1,
        padding: 10,
        backgroundColor: '#ccc',
        borderRadius: 5,
        alignItems: 'center',
        marginRight: 10,
    },
    confirmButton: {
        flex: 1,
        padding: 10,
        backgroundColor: '#FCA510',
        borderRadius: 5,
        alignItems: 'center',
    },
    buttonText: {
        color: 'white',
        fontWeight: 'bold',
    },
});

export default SettingsScreen;
