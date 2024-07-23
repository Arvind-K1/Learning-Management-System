import Course from "../models/course.model.js";
import {AppError} from "../utils/appError.js";

import cloudinary from "cloudinary";
import fs from "fs/promises";
import path from 'path';

import asyncHandler from "../middlewares/asyncHandler.middleware.js";

const getAllCourses = asyncHandler( async (req,res,next) => {
   
        const courses = await Course.find({}).select('-lectures');

        res.status(200).json({
            success: true,
            message: 'All courses',
            courses
        });
    
});

const getLecturesByCourseId = asyncHandler( async (req,res,next) => {
    
        const {id} = req.params;
        const course = await Course.findById(id);

        if(!course){
            return next(new AppError("Invalid course id",400))
        }

        res.status(200).json({
            success: true,
            message: 'Course lectures fetech successfully',
            lectrues: course.lectures
        });

    
});

const createCourse = asyncHandler( async (req,res,next) => {
    
        const { title, description, category, createdBy} = req.body;
    
        if(!title || !description || !category || !createdBy){
            return next(new AppError("Please fill all the fields",400))
        }

        const course = await Course.create({
            title,
            description,
            category,
            createdBy
        });

        if (!course){
            return next(
                new AppError('Course could not be created, please try again', 400)
              );
        }

        if(req.file){
            try {
                const result = await cloudinary.v2.uploader.upload(req.file.path,{
                    folder: 'lms'
                });
    
                if(result){
                    course.thumbnail.public_id = result.public_id;
                    course.thumbnail.secure_url = result.secure_url;
                }

                fs.rm(`uploads/${req.file.filename}`);
                
            } catch (error) {
                for (const file of await fs.readdir('uploads/')) {
                    await fs.unlink(path.join('uploads/', file));
                  }
            
                  return next(
                    new AppError(
                      JSON.stringify(error) || 'File not uploaded, please try again',
                      400
                    )
                  );
            }
        }
            

            await course.save();

            res.status(200).json({
                success: true,
                message: 'Course created successfully',
                course
            });
    
});

const updateCourse = asyncHandler(async (req,res,next) => {
   
        const {id} = req.params;

        const course = await Course.findByIdAndUpdate(
            id,
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
    
});

const  deleteCourse  = asyncHandler( async (req,res,next) => {
    
        const {id} = req.params;
        const course = await Course.findById(id);

        if(!course){
            return next(new AppError('No course found with that ID',404))
        }

        await course.remove();
        
        res.status(200).json({
            success: true,
            message: 'Course deleted successfully'
        })

    
});

const addLectureToCourseById = asyncHandler( async (req,res,next) => {
    
        const {title, description} = req.body;
        const {id} = req.params;

        let lectureData = {};

        if(!title || !description){
            return next(new AppError('Please provide title and description',400))
        }

        const course = await Course.findById(id);

        if(!course){
            return next(new AppError('No course found with that ID',404))
        }

        if(req.file){
            try {
                const result = await cloudinary.v2.uploader.upload(req.file.path,{
                    folder:'lms',
                    chunk_size: 50000000, // 50 mb size
                    resource_type: 'video',
                });

                if(result){
                    lectureData.public_id = result.public_id;
                    lectureData.secure_url = result.secure_url;
                }
    
                fs.rm(`upload/${req.file.filename}`)
            } catch (error) {
                for (const file of await fs.readdir('uploads/')) {
                    await fs.unlink(path.join('uploads/', file));
                  }
            
                  return next(
                    new AppError(
                      JSON.stringify(error) || 'File not uploaded, please try again',
                      400
                    )
                  );
            }
            
        }

        course.lectures.push({
            title,
            description,
            lecture: lectureData,
        });

        course.numberOfLectures = course.lectures.length;

        await course.save();
         res.status(200).json({
            success: true,
            message: 'Lecture added successfully',
            course
         })
    
});

const removeLectureFromCourse = asyncHandler(async (req, res, next) => {
    const { courseId, lectureId } = req.query;
  
      if (!courseId) {
      return next(new AppError('Course ID is required', 400));
    }
  
    if (!lectureId) {
      return next(new AppError('Lecture ID is required', 400));
    }
  
    const course = await Course.findById(courseId);
  
    if (!course) {
      return next(new AppError('Invalid ID or Course does not exist.', 404));
    }
  
    const lectureIndex = course.lectures.findIndex(
      (lecture) => lecture._id.toString() === lectureId.toString()
    );
  
    if (lectureIndex === -1) {
      return next(new AppError('Lecture does not exist.', 404));
    }
  
    await cloudinary.v2.uploader.destroy(
      course.lectures[lectureIndex].lecture.public_id,
      {
        resource_type: 'video',
      }
    );
  
    course.lectures.splice(lectureIndex, 1);
  
    course.numberOfLectures = course.lectures.length;
  
    await course.save();
  
    res.status(200).json({
      success: true,
      message: 'Course lecture removed successfully',
    });
  });
  

export {
    getAllCourses,
    getLecturesByCourseId,
    createCourse,
    updateCourse,
    deleteCourse,
    addLectureToCourseById,
    removeLectureFromCourse,
}