#!/usr/bin/env node

import { Client, Databases, ID, Permission, Role } from 'node-appwrite';
import dotenv from 'dotenv';

dotenv.config();

const client = new Client()
  .setEndpoint(process.env.VITE_APPWRITE_ENDPOINT)
  .setProject(process.env.VITE_APPWRITE_PROJECT_ID)
  .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);
const DATABASE_ID = process.env.VITE_APPWRITE_DATABASE_ID;

async function createCollections() {
  try {
    console.log('🚀 開始創建 Appwrite Collections...\n');

    // 1. 創建 Courses Collection
    console.log('📚 創建 Courses Collection...');
    const coursesCollection = await databases.createCollection(
      DATABASE_ID,
      'courses',
      'Courses',
      [
        Permission.read(Role.any()),
        Permission.create(Role.users()),
        Permission.update(Role.users()),
        Permission.delete(Role.users())
      ]
    );

    // Courses 屬性
    await databases.createStringAttribute(DATABASE_ID, 'courses', 'code', 20, true);
    await databases.createStringAttribute(DATABASE_ID, 'courses', 'title', 200, true);
    await databases.createStringAttribute(DATABASE_ID, 'courses', 'description', 2000, false);
    await databases.createIntegerAttribute(DATABASE_ID, 'courses', 'credits', true, 1, 10);
    await databases.createStringAttribute(DATABASE_ID, 'courses', 'department', 100, true);
    await databases.createEnumAttribute(DATABASE_ID, 'courses', 'level', ['UG', 'PG', 'PhD'], true);
    await databases.createStringAttribute(DATABASE_ID, 'courses', 'prerequisites', 50, false, undefined, true);
    await databases.createBooleanAttribute(DATABASE_ID, 'courses', 'isActive', true, true);

    // 等待屬性創建完成
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Courses 索引
    await databases.createIndex(DATABASE_ID, 'courses', 'code_index', 'unique', ['code']);
    await databases.createIndex(DATABASE_ID, 'courses', 'department_index', 'key', ['department']);

    console.log('✅ Courses Collection 創建完成\n');

    // 2. 創建 Lecturers Collection
    console.log('👨‍🏫 創建 Lecturers Collection...');
    const lecturersCollection = await databases.createCollection(
      DATABASE_ID,
      'lecturers',
      'Lecturers',
      [
        Permission.read(Role.any()),
        Permission.create(Role.users()),
        Permission.update(Role.users()),
        Permission.delete(Role.users())
      ]
    );

    // Lecturers 屬性
    await databases.createStringAttribute(DATABASE_ID, 'lecturers', 'name', 100, true);
    await databases.createEnumAttribute(DATABASE_ID, 'lecturers', 'title', ['Prof', 'Dr', 'Mr', 'Ms', 'Ir'], true);
    await databases.createStringAttribute(DATABASE_ID, 'lecturers', 'department', 100, true);
    await databases.createEmailAttribute(DATABASE_ID, 'lecturers', 'email', false);
    await databases.createStringAttribute(DATABASE_ID, 'lecturers', 'office', 50, false);
    await databases.createStringAttribute(DATABASE_ID, 'lecturers', 'specialties', 100, false, undefined, true);
    await databases.createStringAttribute(DATABASE_ID, 'lecturers', 'bio', 1000, false);
    await databases.createBooleanAttribute(DATABASE_ID, 'lecturers', 'isActive', true, true);

    await new Promise(resolve => setTimeout(resolve, 2000));

    // Lecturers 索引
    await databases.createIndex(DATABASE_ID, 'lecturers', 'name_index', 'key', ['name']);
    await databases.createIndex(DATABASE_ID, 'lecturers', 'department_index', 'key', ['department']);

    console.log('✅ Lecturers Collection 創建完成\n');

    // 3. 創建 Course Sections Collection
    console.log('🔗 創建 Course Sections Collection...');
    const sectionsCollection = await databases.createCollection(
      DATABASE_ID,
      'course_sections',
      'Course Sections',
      [
        Permission.read(Role.any()),
        Permission.create(Role.users()),
        Permission.update(Role.users()),
        Permission.delete(Role.users())
      ]
    );

    // Course Sections 屬性
    await databases.createStringAttribute(DATABASE_ID, 'course_sections', 'courseId', 36, true);
    await databases.createStringAttribute(DATABASE_ID, 'course_sections', 'lecturerId', 36, true);
    await databases.createStringAttribute(DATABASE_ID, 'course_sections', 'semester', 20, true);
    await databases.createStringAttribute(DATABASE_ID, 'course_sections', 'sectionCode', 10, true);
    await databases.createEnumAttribute(DATABASE_ID, 'course_sections', 'role', ['lecturer', 'tutor', 'lab_instructor', 'guest_lecturer'], true);
    await databases.createStringAttribute(DATABASE_ID, 'course_sections', 'schedule', 200, false);
    await databases.createStringAttribute(DATABASE_ID, 'course_sections', 'venue', 100, false);
    await databases.createIntegerAttribute(DATABASE_ID, 'course_sections', 'maxStudents', false, 1, 500);
    await databases.createBooleanAttribute(DATABASE_ID, 'course_sections', 'isActive', true, true);

    await new Promise(resolve => setTimeout(resolve, 2000));

    // Course Sections 索引
    await databases.createIndex(DATABASE_ID, 'course_sections', 'course_lecturer_index', 'key', ['courseId', 'lecturerId']);
    await databases.createIndex(DATABASE_ID, 'course_sections', 'semester_index', 'key', ['semester']);

    console.log('✅ Course Sections Collection 創建完成\n');

    // 4. 創建 Reviews Collection
    console.log('⭐ 創建 Reviews Collection...');
    const reviewsCollection = await databases.createCollection(
      DATABASE_ID,
      'reviews',
      'Reviews',
      [
        Permission.read(Role.any()),
        Permission.create(Role.users()),
        Permission.update(Role.users()),
        Permission.delete(Role.users())
      ]
    );

    // Reviews 屬性
    await databases.createStringAttribute(DATABASE_ID, 'reviews', 'userId', 36, true);
    await databases.createStringAttribute(DATABASE_ID, 'reviews', 'courseId', 36, true);
    await databases.createStringAttribute(DATABASE_ID, 'reviews', 'lecturerId', 36, true);
    await databases.createStringAttribute(DATABASE_ID, 'reviews', 'sectionId', 36, false);
    await databases.createFloatAttribute(DATABASE_ID, 'reviews', 'overallRating', true, 1.0, 5.0);
    await databases.createFloatAttribute(DATABASE_ID, 'reviews', 'teachingRating', false, 1.0, 5.0);
    await databases.createFloatAttribute(DATABASE_ID, 'reviews', 'difficultyRating', false, 1.0, 5.0);
    await databases.createFloatAttribute(DATABASE_ID, 'reviews', 'workloadRating', false, 1.0, 5.0);
    await databases.createStringAttribute(DATABASE_ID, 'reviews', 'content', 2000, true);
    await databases.createStringAttribute(DATABASE_ID, 'reviews', 'tags', 50, false, undefined, true);
    await databases.createStringAttribute(DATABASE_ID, 'reviews', 'semester', 20, true);
    await databases.createBooleanAttribute(DATABASE_ID, 'reviews', 'isAnonymous', false, false);
    await databases.createBooleanAttribute(DATABASE_ID, 'reviews', 'isVerified', false, false);

    await new Promise(resolve => setTimeout(resolve, 2000));

    // Reviews 索引
    await databases.createIndex(DATABASE_ID, 'reviews', 'course_lecturer_index', 'key', ['courseId', 'lecturerId']);
    await databases.createIndex(DATABASE_ID, 'reviews', 'user_index', 'key', ['userId']);

    console.log('✅ Reviews Collection 創建完成\n');

    console.log('🎉 所有 Collections 創建完成！');
    console.log('\n📋 創建的 Collections：');
    console.log('- courses (課程)');
    console.log('- lecturers (講師)');
    console.log('- course_sections (課程班別)');
    console.log('- reviews (評價)');

  } catch (error) {
    console.error('❌ 創建 Collections 時發生錯誤：', error);
  }
}

// 執行創建
createCollections(); 