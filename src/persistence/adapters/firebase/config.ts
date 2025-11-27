import * as admin from 'firebase-admin';

export interface FirebaseConfig {
    credential?: admin.credential.Credential;
    projectId?: string;
    databaseURL?: string;
    storageBucket?: string;
}
