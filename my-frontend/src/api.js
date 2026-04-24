import axios from 'axios';

export const BASE_URL = process.env.REACT_APP_BASE_URL || 'http://localhost:5000';

class VigilKuraApi {
    static async request(endpoint, data = {}, method = 'get') {
        const url = `${BASE_URL}/${endpoint}`;
        const token = localStorage.getItem('token');
        const headers = { Authorization: token ? `Bearer ${token}` : undefined };
        const params = method === 'get' ? data : {};

        try {
            const res = await axios({ url, method, data, params, headers });
            return res.data;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }

    static async login(username, password) {
        return VigilKuraApi.request('auth/login', { email: username, password }, 'post');
    }

    static async getUserByUsername(username) {
        return VigilKuraApi.request(`user/${username}`);
    }

    static async updateUser(username, data) {
        return VigilKuraApi.request(`user/${username}`, data, 'put');
    }

    static async updateSettings(username, settings) {
        return VigilKuraApi.request(`user/${username}`, { settings }, 'put');
    }

    static async verifyPin(username, pin) {
        return VigilKuraApi.request(`user/${username}/verify-pin`, { pin }, 'post');
    }

    static async startSession(username, childId = null) {
        return VigilKuraApi.request('sessions/start', { username, childId }, 'post');
    }

    static async endSession(sessionId) {
        return VigilKuraApi.request(`sessions/${sessionId}/end`, {}, 'put');
    }

    static async addDetection(sessionId, username, word, context, childName, notify = null) {
        return VigilKuraApi.request(`sessions/${sessionId}/detections`, { username, word, context, childName, notify }, 'post');
    }

    static async notifyTimeUp(username, childName, notify) {
        return VigilKuraApi.request('sessions/notify-time-up', { username, childName, notify }, 'post');
    }

    static async addTranscript(sessionId, text) {
        return VigilKuraApi.request(`sessions/${sessionId}/transcripts`, { text }, 'post');
    }

    static async getTranscripts(sessionId) {
        return VigilKuraApi.request(`sessions/${sessionId}/transcripts`);
    }

    static async getSessions(username, childId = null) {
        const params = childId ? `?childId=${childId}` : '';
        return VigilKuraApi.request(`sessions/user/${username}${params}`);
    }

    static async getDetections(sessionId) {
        return VigilKuraApi.request(`sessions/${sessionId}/detections`);
    }

    static async getChildren() {
        return VigilKuraApi.request('children');
    }

    static async addChild(name) {
        return VigilKuraApi.request('children', { name }, 'post');
    }

    static async renameChild(id, name) {
        return VigilKuraApi.request(`children/${id}/name`, { name }, 'put');
    }

    static async updateChildSettings(id, settings) {
        return VigilKuraApi.request(`children/${id}/settings`, { settings }, 'put');
    }

    static async removeChild(id) {
        return VigilKuraApi.request(`children/${id}`, {}, 'delete');
    }

    static async deleteUser(username) {
        return VigilKuraApi.request(`user/${username}`, {}, 'delete');
    }

    static async forgotPassword(email) {
        return VigilKuraApi.request('auth/forgot-password', { email }, 'post');
    }

    static async resetPassword(token, password) {
        return VigilKuraApi.request('auth/reset-password', { token, password }, 'post');
    }
}

export default VigilKuraApi;
