import { tablesDB, ID } from '@/lib/appwrite';
import { CustomAvatar } from "@/utils/ui/avatarUtils";
import { Query } from 'appwrite';

const DATABASE_ID = 'lingubible';
const COLLECTION_ID = 'user_avatars';

export interface UserAvatarDocument {
  $id: string;
  userId: string;
  animal: string;
  backgroundIndex: number;
  createdAt: string;
  updatedAt: string;
}

class AvatarService {
  // 獲取用戶的自定義頭像
  async getUserAvatar(userId: string): Promise<CustomAvatar | null> {
    try {
      const response = await tablesDB.listRows({
        databaseId: DATABASE_ID,
        tableId: COLLECTION_ID,
        queries: [
          Query.equal('userId', userId)
        ]
      });

      if (response.rows.length > 0) {
        const doc = response.rows[0] as unknown as UserAvatarDocument;
        return {
          animal: doc.animal,
          backgroundIndex: doc.backgroundIndex,
          createdAt: doc.createdAt
        };
      }

      return null;
    } catch (error) {
      console.error('獲取用戶頭像失敗:', error);
      return null;
    }
  }

  // 保存或更新用戶的自定義頭像
  async saveUserAvatar(userId: string, avatar: Omit<CustomAvatar, 'createdAt'>): Promise<boolean> {
    try {
      // 先檢查是否已存在
      const existing = await this.getUserAvatar(userId);
      const now = new Date().toISOString();

      if (existing) {
        // 更新現有記錄
        const response = await tablesDB.listRows({
          databaseId: DATABASE_ID,
          tableId: COLLECTION_ID,
          queries: [
            Query.equal('userId', userId)
          ]
        });

        if (response.rows.length > 0) {
          await tablesDB.updateRow({
            databaseId: DATABASE_ID,
            tableId: COLLECTION_ID,
            rowId: response.rows[0].$id,
            data: {
              animal: avatar.animal,
              backgroundIndex: avatar.backgroundIndex,
              updatedAt: now
            }
          });
        }
      } else {
        // 創建新記錄
        await tablesDB.createRow({
          databaseId: DATABASE_ID,
          tableId: COLLECTION_ID,
          rowId: ID.unique(),
          data: {
            userId,
            animal: avatar.animal,
            backgroundIndex: avatar.backgroundIndex,
            createdAt: now,
            updatedAt: now
          }
        });
      }

      return true;
    } catch (error) {
      console.error('保存用戶頭像失敗:', error);
      return false;
    }
  }

  // 刪除用戶的自定義頭像
  async deleteUserAvatar(userId: string): Promise<boolean> {
    try {
      const response = await tablesDB.listRows({
        databaseId: DATABASE_ID,
        tableId: COLLECTION_ID,
        queries: [
          Query.equal('userId', userId)
        ]
      });

      if (response.rows.length > 0) {
        await tablesDB.deleteRow({
          databaseId: DATABASE_ID,
          tableId: COLLECTION_ID,
          rowId: response.rows[0].$id
        });
      }

      return true;
    } catch (error) {
      console.error('刪除用戶頭像失敗:', error);
      return false;
    }
  }

  // 獲取頭像統計信息
  async getAvatarStats(): Promise<{
    totalCustomAvatars: number;
    popularAnimals: { animal: string; count: number }[];
    popularBackgrounds: { backgroundIndex: number; count: number }[];
  }> {
    try {
      const response = await tablesDB.listRows({
        databaseId: DATABASE_ID,
        tableId: COLLECTION_ID,
        queries: [
          Query.limit(100)
        ]
      });

      const docs = response.rows as unknown as UserAvatarDocument[];
      
      // 統計動物使用頻率
      const animalCounts: { [key: string]: number } = {};
      const backgroundCounts: { [key: number]: number } = {};

      docs.forEach(doc => {
        animalCounts[doc.animal] = (animalCounts[doc.animal] || 0) + 1;
        backgroundCounts[doc.backgroundIndex] = (backgroundCounts[doc.backgroundIndex] || 0) + 1;
      });

      const popularAnimals = Object.entries(animalCounts)
        .map(([animal, count]) => ({ animal, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      const popularBackgrounds = Object.entries(backgroundCounts)
        .map(([backgroundIndex, count]) => ({ backgroundIndex: parseInt(backgroundIndex), count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      return {
        totalCustomAvatars: docs.length,
        popularAnimals,
        popularBackgrounds
      };
    } catch (error) {
      console.error('獲取頭像統計失敗:', error);
      return {
        totalCustomAvatars: 0,
        popularAnimals: [],
        popularBackgrounds: []
      };
    }
  }
}

export const avatarService = new AvatarService(); 