import express from 'express';

import { addLectureToCourseById, createCourse, deleteCourse, getAllCourses, getLecturesByCourseId, updateCourse } from '../controllers/course.controllers.js';
import { authorizedRole, authorizedSubscriber, isLoggedIn } from '../middlewares/auth.middleware.js';
// import { createCollection } from '../models/course.model.js';
import { upload } from '../middlewares/multer.middleware.js';

const router = express.Router();

router
    .route('/')
    .get(getAllCourses)
    .post(
        isLoggedIn,
        authorizedRole('ADMIN'),
        upload.single('thumbnail'),
        createCourse
    )
    .delete(
        isLoggedIn,
        authorizedRole('ADMIN'),
        deleteCourse
    );

router
    .route('/:id')
    .get(
        isLoggedIn,
        authorizedSubscriber,
        getLecturesByCourseId
    )
    .put(
        isLoggedIn,
        authorizedRole('ADMIN'),
        updateCourse
    )
    .post(
        isLoggedIn,
        authorizedRole('ADMIN'),
        upload.single('lecture'),
        addLectureToCourseById
    );

    export default router;