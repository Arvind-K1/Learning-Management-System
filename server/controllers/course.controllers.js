import Course from "../models/course.model.js";
import AppError from "../utils/appError.js";
import cloudinary from "cloudinary";
import fs from "fs/promises";

const getAllCourses = async function(req,res,next){
    try {
        const courses = await Course.find({}).select('-lecture');

        res.status(200).json({
            success: true,
            message: 'All courses',
            courses
        })
    } catch (e) {
        return next(new AppError(e.message,500))
    }
}

const getLecturesByCourseId = async (req,res,next) => {
    try {
        const {courseId} = req.params;
        const course = await Course.findById({courseId});

        if(!course){
            return next(new AppError("Invalid course id",400))
        }

        res.status(200).json({
            success: true,
            message: 'Course lectures fetech successfully',
            lectrues: course.lectures
        })

    } catch (e) {
            return next(new AppError(e.message,500))
        
    }
}

const createCourse = async (req,res,next) => {
    try {
        const { title, description, category, createdBy} = req.body;
    
        if(!title || !description || !category || !createdBy){
            return next(new AppError("Please fill all the fields",400))
        }

        const course = await Course.create({
            title,
            description,
            category,
            thumbnail: {
                public_id: 'DUMMY',
                secure_url: "DUMMY"
            }
        });

        if(req.file){
            const result = await cloudinary.v2.uploader.upload(req.file.path,{
                folder: 'lms'
            });

            if(result){
                course.thumbnail.public_id = result.public_id;
                course.thumbnail.secure_url = result.secure_url;
            }

            await course.save();

            res.status(200).json({
                success: true,
                message: 'Course created successfully',
                course
            })

        }
        
        fs.rm(`uploads/${req.file.filename}`);

    } catch (error) {
        return next(new AppError(error.message,500))
    }
}

const updateCourse = async (req,res,next) => {
    try {
        const {courseID} = req.params;

        const course = await Course.findByIdAndUpdate(
            courseID,
            {
                $set: req.body
            },
            {
                runValidators: true
            }
        )

        if(!course){
            return next(new AppError('No course found with that ID',404))
        }

        res.status(201).json({
            success: true,
            message: 'Course updated successfully',
            course
        })
    } catch (e) {
        return next(new AppError(e.message,500))
    }
}

const  deleteCourse  = async (req,res,next) => {
    try {
        const {courseId} = req.params;
        const course = await Course.findById(courseId);

        if(!course){
            return next(new AppError('No course found with that ID',404))
        }

        await Course.findByIdAndDelete(courseId);

        res.status(200).json({
            success: true,
            message: 'Course deleted successfully'
        })

    } catch (e) {
        return next(new AppError(e.message,500))

    }
};

const addLectureToCourseById = async (req,res,next) => {
    try {
        const {title, description} = req.body;
        const {courseId} = req.params;

        if(!title || !description){
            return next(new AppError('Please provide title and description',400))
        }

        const course = await Course.findById(courseId);

        if(!course){
            return next(new AppError('No course found with that ID',404))
        }

        const lectureData = {
            title,
            description,
            lecture: {}
        }

        if(req.file){
            const result = await cloudinary.v2.uploader.upload(req.file.path,{
                folder:'lms',
            });
            if(result){
                lectureData.lecture.public_id = result.public_id;
                lectureData.lecture.secure_url = result.secure_url;
            }

            fs.rm(`upload/${req.file.filename}`)
        }

        course.lectures.push(lectureData);
        course.numberOfLectures = course.lectures.length;

        await course.save();
         res.status(200).json({
            success: true,
            message: 'Lecture added successfully',
            course
         })
    }
    catch(e){
        return next(new AppError(e.message,500))
    }
}

export {
    getAllCourses,
    getLecturesByCourseId,
    createCourse,
    updateCourse,
    deleteCourse,
    addLectureToCourseById
}