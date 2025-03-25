import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

interface UserSession {
    email: string;
    sessionId: string;
    accessToken?: string;
    createdAt: string;
    lastAccessed: string;
    [key: string]: any;
}

export class SessionManager {
    private static instance: SessionManager;
    private sessionsDir: string;
    private emailToSessionMap: Map<string, string>; // Maps email to session filename

    private constructor() {
        this.sessionsDir = path.join(__dirname, '../sessions');
        this.emailToSessionMap = new Map();
        this.initializeSessionsDirectory();
        this.loadExistingSessions();
    }

    public static getInstance(): SessionManager {
        if (!SessionManager.instance) {
            SessionManager.instance = new SessionManager();
        }
        return SessionManager.instance;
    }

    private initializeSessionsDirectory() {
        if (!fs.existsSync(this.sessionsDir)) {
            fs.mkdirSync(this.sessionsDir, { recursive: true });
        }
    }

    private loadExistingSessions() {
        const files = fs.readdirSync(this.sessionsDir);
        files.forEach(file => {
            if (file.endsWith('.json')) {
                try {
                    const sessionData = JSON.parse(fs.readFileSync(path.join(this.sessionsDir, file), 'utf-8'));
                    if (sessionData.email) {
                        this.emailToSessionMap.set(sessionData.email, file);
                    }
                } catch (error) {
                    console.error(`Error loading session file ${file}:`, error);
                }
            }
        });
    }

    public createSession(email: string, initialData?: Partial<UserSession>): string {
        const sessionId = uuidv4();
        const sessionFile = `${sessionId}.json`;
        const sessionData: UserSession = {
            email,
            sessionId,
            createdAt: new Date().toISOString(),
            lastAccessed: new Date().toISOString(),
            ...initialData
        };

        // Save session data to file
        const sessionPath = path.join(this.sessionsDir, sessionFile);
        fs.writeFileSync(sessionPath, JSON.stringify(sessionData, null, 2));

        // Update the email-to-session mapping
        this.emailToSessionMap.set(email, sessionFile);

        console.log('\n=== Session Created ===');

        return sessionId;
    }

    public getSession(email: string): UserSession | null {
        const sessionFile = this.emailToSessionMap.get(email);
        if (!sessionFile) {
            console.log('\n=== No Session Found ===');
            return null;
        }

        try {
            const sessionPath = path.join(this.sessionsDir, sessionFile);
            if (!fs.existsSync(sessionPath)) {
                console.log('\n=== Session File Not Found ===');
                this.emailToSessionMap.delete(email);
                return null;
            }

            const sessionData = JSON.parse(fs.readFileSync(sessionPath, 'utf-8')) as UserSession;
            sessionData.lastAccessed = new Date().toISOString();
            fs.writeFileSync(sessionPath, JSON.stringify(sessionData, null, 2));

            console.log('\n=== Session Retrieved ===');

            return sessionData;
        } catch (error) {
            console.error(`Error reading session file ${sessionFile}:`, error);
            this.emailToSessionMap.delete(email);
            return null;
        }
    }

    public deleteSession(email: string): boolean {
        const sessionFile = this.emailToSessionMap.get(email);
        if (!sessionFile) {
            return false;
        }

        try {
            const sessionPath = path.join(this.sessionsDir, sessionFile);
            if (fs.existsSync(sessionPath)) {
                fs.unlinkSync(sessionPath);
            }
            this.emailToSessionMap.delete(email);
            return true;
        } catch (error) {
            console.error(`Error deleting session file ${sessionFile}:`, error);
            return false;
        }
    }

    public updateSession(email: string, data: Partial<UserSession>): boolean {
        const sessionFile = this.emailToSessionMap.get(email);
        if (!sessionFile) {
            return false;
        }

        try {
            const sessionPath = path.join(this.sessionsDir, sessionFile);
            const sessionData = JSON.parse(fs.readFileSync(sessionPath, 'utf-8')) as UserSession;
            const updatedData = { ...sessionData, ...data, lastAccessed: new Date().toISOString() };
            fs.writeFileSync(sessionPath, JSON.stringify(updatedData, null, 2));
            return true;
        } catch (error) {
            console.error(`Error updating session file ${sessionFile}:`, error);
            return false;
        }
    }

    public getAccessToken(email: string): string | null {
        const session = this.getSession(email);
        return session?.accessToken || null;
    }

    public clearSession(email: string): void {
        this.deleteSession(email);
    }

    public getAllSessions(): Map<string, string> {
        return new Map(this.emailToSessionMap);
    }
} 