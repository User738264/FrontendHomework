import { Client, Account, Databases, Storage, ID, Query } from 'appwrite';
import { APPWRITE_CONFIG } from './config';
import { type Presentation } from '../types';

class AppwriteService {
  private client: Client;
  private account: Account;
  private databases: Databases;
  private storage: Storage;

  constructor() {
    this.client = new Client();
    this.client
      .setEndpoint(APPWRITE_CONFIG.ENDPOINT)
      .setProject(APPWRITE_CONFIG.PROJECT_ID);

    this.account = new Account(this.client);
    this.databases = new Databases(this.client);
    this.storage = new Storage(this.client);
  }

  async register(email: string, password: string, name: string) {
    try {
      const user = await this.account.create(ID.unique(), email, password, name);
      return user;
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  }

  async login(email: string, password: string) {
    try {
      const session = await this.account.createEmailPasswordSession(email, password);
      return session;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  async logout() {
    try {
      await this.account.deleteSession('current');
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  }

  async getCurrentUser() {
    try {
      return await this.account.get();
    } catch (error) {
      console.error('Get user error:', error);
      return null;
    }
  }

  async savePresentation(presentation: Presentation, documentId?: string) {
    try {
      const user = await this.getCurrentUser();
      if (!user) throw new Error('User not authenticated');

      if (documentId) {
        console.log('Updating existing presentation:', documentId);
        return await this.databases.updateDocument(
          APPWRITE_CONFIG.DATABASE_ID,
          APPWRITE_CONFIG.COLLECTION_ID,
          documentId,
          {
            presentation: JSON.stringify(presentation),
            title: presentation.title,
            updatedAt: new Date().toISOString()
          }
        );
      } else {
        console.log('Creating new presentation');
        return await this.databases.createDocument(
          APPWRITE_CONFIG.DATABASE_ID,
          APPWRITE_CONFIG.COLLECTION_ID,
          ID.unique(),
          {
            userId: user.$id,
            title: presentation.title,
            presentation: JSON.stringify(presentation),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        );
      }
    } catch (error) {
      console.error('Save presentation error:', error);
      throw error;
    }
  }

  async getUserPresentations() {
    try {
      const user = await this.getCurrentUser();
      if (!user) return [];

      const response = await this.databases.listDocuments(
        APPWRITE_CONFIG.DATABASE_ID,
        APPWRITE_CONFIG.COLLECTION_ID,
        [Query.equal('userId', user.$id)]
      );

      return response.documents;
    } catch (error) {
      console.error('Get presentations error:', error);
      throw error;
    }
  }

  async getPresentation(id: string) {
    try {
      const doc = await this.databases.getDocument(
        APPWRITE_CONFIG.DATABASE_ID,
        APPWRITE_CONFIG.COLLECTION_ID,
        id
      );
      
      if (!doc || !doc.presentation) {
        console.error('Document is missing presentation field:', doc);
        throw new Error('Document is missing presentation data');
      }
      
      return doc;
    } catch (error) {
      console.error('Get presentation error:', error);
      throw error;
    }
  }

  async deletePresentation(id: string) {
    try {
      await this.databases.deleteDocument(
        APPWRITE_CONFIG.DATABASE_ID,
        APPWRITE_CONFIG.COLLECTION_ID,
        id
      );
    } catch (error) {
      console.error('Delete presentation error:', error);
      throw error;
    }
  }

  async uploadImage(file: File): Promise<string> {
    try {
      const user = await this.getCurrentUser();
      if (!user) throw new Error('User not authenticated');

      const result = await this.storage.createFile(
        APPWRITE_CONFIG.STORAGE_BUCKET_ID,
        ID.unique(),
        file
      );

      const fileId = result.$id;
      const url = this.generateFileUrl(fileId);
      console.log('Image uploaded. File ID:', fileId, 'URL:', url);
      return url;
    } catch (error) {
      console.error('Upload image error:', error);
      throw error;
    }
  }

  generateFileUrl(fileId: string): string {
    return `${APPWRITE_CONFIG.ENDPOINT}/storage/buckets/${APPWRITE_CONFIG.STORAGE_BUCKET_ID}/files/${fileId}/view?project=${APPWRITE_CONFIG.PROJECT_ID}`;
  }

  generateDownloadUrl(fileId: string): string {
    return `${APPWRITE_CONFIG.ENDPOINT}/storage/buckets/${APPWRITE_CONFIG.STORAGE_BUCKET_ID}/files/${fileId}/download?project=${APPWRITE_CONFIG.PROJECT_ID}`;
  }

  async getFilePreview(fileId: string): Promise<string> {
    try {
      const url = this.storage.getFilePreview(
        APPWRITE_CONFIG.STORAGE_BUCKET_ID,
        fileId
      );
      
      if (url.startsWith('/')) {
        return `${APPWRITE_CONFIG.ENDPOINT}${url}`;
      }
      
      return url;
    } catch (error) {
      console.error('Get file preview error:', error);
      throw error;
    }
  }

  async deleteFile(fileId: string) {
    try {
      await this.storage.deleteFile(
        APPWRITE_CONFIG.STORAGE_BUCKET_ID,
        fileId
      );
    } catch (error) {
      console.error('Delete file error:', error);
      throw error;
    }
  }
}

export const appwriteService = new AppwriteService();