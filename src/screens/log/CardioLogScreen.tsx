import React, { useState } from 'react';
import {
    View, Text, StyleSheet, ScrollView, Pressable, TextInput,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { theme } from '../../theme';
import { useApp } from '../../store/AppContext';
import Card from '../../components/ui/Card';
import AnimatedBackground from '../../components/ui/AnimatedBackground';
import Toast from 'react-native-toast-message';

export default function CardioLogScreen({ navigation }: any) {
    const { logCardio, todayCardioLogs } = useApp();
    const [type, setType] = useState('Run');
    const [duration, setDuration] = useState('');
    const [calories, setCalories] = useState('');

    const handleLog = async () => {
        const dur = parseInt(duration);
        const cals = parseInt(calories);
        if (!dur) return;
        try {
            await logCardio(type, dur, cals || 0);
            Toast.show({ type: 'success', text1: 'Cardio Logged', text2: `${type} for ${dur} mins.` });
            setDuration('');
            setCalories('');
        } catch (e) {
            console.warn(e);
        }
    };

    const types = ['Run', 'Cycle', 'Swim', 'Walk', 'HIIT', 'Other'];

    return (
        <View style={styles.container}>
            <AnimatedBackground />
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.header}>
                    <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
                        <Ionicons name="chevron-back" size={24} color="#fff" />
                    </Pressable>
                    <Text style={styles.title}>Cardio Session</Text>
                </View>

                <View style={styles.typeSelector}>
                    {types.map((t) => (
                        <Pressable
                            key={t}
                            style={[styles.typeChip, type === t && styles.typeChipActive]}
                            onPress={() => setType(t)}
                        >
                            <Text style={[styles.typeText, type === t && { color: '#000' }]}>{t}</Text>
                        </Pressable>
                    ))}
                </View>

                <Card style={styles.inputCard}>
                    <Text style={styles.label}>Duration (minutes)</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="e.g. 30"
                        placeholderTextColor={theme.colors.textTertiary}
                        value={duration}
                        onChangeText={setDuration}
                        keyboardType="numeric"
                    />
                    <Text style={styles.label}>Calories Burned (optional)</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="e.g. 300"
                        placeholderTextColor={theme.colors.textTertiary}
                        value={calories}
                        onChangeText={setCalories}
                        keyboardType="numeric"
                    />
                    <Pressable style={styles.logBtn} onPress={handleLog}>
                        <Text style={styles.logBtnText}>Save Session</Text>
                    </Pressable>
                </Card>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Recent Sessions</Text>
                    {todayCardioLogs.length === 0 ? (
                        <Text style={styles.emptyText}>No cardio logged today.</Text>
                    ) : (
                        todayCardioLogs.map((log) => (
                            <View key={log.id} style={styles.logItem}>
                                <View style={styles.iconBox}>
                                    <Ionicons name="heart" size={20} color={theme.colors.error} />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.logType}>{log.cardio_type}</Text>
                                    <Text style={styles.logMeta}>{log.duration_minutes} mins • {log.calories_burned} kcal</Text>
                                </View>
                                <Text style={styles.logTime}>{new Date(log.logged_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                            </View>
                        ))
                    )}
                </View>

                <View style={{ height: 100 }} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    scrollContent: {
        padding: 20,
        paddingTop: 60,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 30,
    },
    backBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.05)',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    title: {
        color: '#fff',
        fontSize: 24,
        fontWeight: '800',
    },
    typeSelector: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
        marginBottom: 24,
    },
    typeChip: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    typeChipActive: {
        backgroundColor: theme.colors.accent,
        borderColor: theme.colors.accent,
    },
    typeText: {
        color: theme.colors.textSecondary,
        fontSize: 14,
        fontWeight: '600',
    },
    inputCard: {
        padding: 20,
        marginBottom: 30,
    },
    label: {
        color: theme.colors.textSecondary,
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 12,
    },
    input: {
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 12,
        padding: 16,
        color: '#fff',
        fontSize: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    logBtn: {
        backgroundColor: theme.colors.accent,
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        marginTop: 8,
    },
    logBtnText: {
        color: '#000',
        fontSize: 16,
        fontWeight: '700',
    },
    section: {
        marginBottom: 30,
    },
    sectionTitle: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '800',
        marginBottom: 16,
    },
    emptyText: {
        color: theme.colors.textTertiary,
        fontSize: 14,
        textAlign: 'center',
        marginTop: 10,
    },
    logItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderRadius: 16,
        padding: 12,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    iconBox: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    logType: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    logMeta: {
        color: theme.colors.textSecondary,
        fontSize: 12,
        marginTop: 2,
    },
    logTime: {
        color: theme.colors.textTertiary,
        fontSize: 12,
    },
});
