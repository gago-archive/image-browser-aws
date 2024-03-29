// Copyright 2017 huteng (huteng@gagogroup.com). All rights reserved.,
// Use of this source code is governed a license that can be found in the LICENSE file.
import * as multer from "multer";

import {Validator, BadRequestResponse, SuccessResponse, ErrorResponse, DateUtil} from "sakura-node";

import {BaseController, Request, Response, NextFunction} from "../base/basecontroller";
import {ImageComposeService} from "./imagecomposeservice";
import {ApplicationContext} from "../util/applicationcontext";

// specfify the upload compose picture file saving location
const storage = multer.diskStorage({
  destination:  (req, file, cb) => {
    let composeImageFilesSavingDir: string = ApplicationContext.getComposeImageFilesSavingDir();
    cb(null, composeImageFilesSavingDir);
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  }
});

const upload = multer({ storage: storage}).single("uploadfile");

export class ImageComposeController extends BaseController {

  /**
   * Get the composed picture and put it in specify folder. It will be synchronized from aws to azure
   *
   * @static
   *
   * @memberOf ImageComposeController
   */
  static async uploadComposeImageToSynchronizeToAzure(req: Request, res: Response, next: NextFunction): Promise<void> {
    upload(req, res, (err: Error) => {
      if (err) {
        // An error occurred when uploading
        res.json(new ErrorResponse("UPLOAD_FILE_FAIL", 501));
      } else {
        res.json(new SuccessResponse({

        }));
      }
    });
  }

  /**
   * users upload their own algorithm code (python), save it in /tmp for later compose image
   *
   * @memberOf ImageComposeController
   */
  static async addImageComposeCodeFromClient(req: Request, res: Response, next: NextFunction): Promise<void> {
    const pythonCode: string = req.body["code"];

    // Take the user new code part and insert into template to make a new algorithm, return the timestamp as code id
    let nowTimeStamp: timestamp = await ImageComposeService.insertImageComposeCodeAndSavingForTemp(pythonCode);
    res.json(new SuccessResponse({
      pythonCodeId:  nowTimeStamp
    }));
  }

  /**
   * Use the last request python code(saving for temp) to compose new image, return to front
   *
   * @static
   * @param {Request} req
   * @param {Response} res
   * @param {NextFunction} next
   * @returns {Promise<void>}
   *
   * @memberOf ImageComposeController
   */
  static async getComposeMapImage(req: Request, res: Response, next: NextFunction): Promise<void> {
    let validator: Validator = new Validator();

    const tempPythonCodeId: string = validator.toStr(req.query["codeId"], "invalid codeId");
    const latitude: number = validator.toNumber(req.query["x"], "invalid latitude");
    const longitude: number = validator.toNumber(req.query["y"], "invalid longitude");
    const zoom: number = validator.toNumber(req.query["z"], "invalid zoom");

    const bandArray: string [] = req.query["bands"].substring(1, req.query["bands"].length - 1).split(",");

    // const originPictureNameArray: string [] = req.body["originPictureNameArray"].substring(1, req.query["originPictureNameArray"].length - 1).split(",");

    if (validator.hasErrors()) {
      res.json(new BadRequestResponse(validator.errors));
      return;
    }

    try {

      // Use the gegograph info to get the tiles name. The tiles is sliced and saved in AWS.
      let originPictureFilePathArray: string[] = await ImageComposeService.getOriginWavePictureLocation(latitude, longitude, zoom, bandArray);

      // Use the origin picture and new script to make new picture, return to front
      let exportPictureFilePath: string = await ImageComposeService.calcualteAndExportNewPicByPython(tempPythonCodeId, originPictureFilePathArray);
      res.sendFile(exportPictureFilePath);
    } catch (err) {
      if (err.message === "TEMPLATE_FILE_NO_EXIST") {
        res.json(new ErrorResponse("TEMPLATE_FILE_NO_EXIST", 501));
      } else if (err.message === "PYTHON_RUN_ERROR") {
        res.json(new ErrorResponse("PYTHON_RUN_ERROR", 501));
      } else if (err.message === "EXPORT_FILE_FAIL") {
        res.json(new ErrorResponse("EXPORT_FILE_FAIL", 501));
      }else {
        next(err);
      }
    }
  }

  /**
   * Save client own python code in server, which could re-use next time
   *
   * @static
   *
   * @memberOf ImageComposeController
   */
  static async saveClientOwnPythonCode(req: Request, res: Response, next: NextFunction): Promise<void> {
    let validator: Validator = new Validator();

    const pythonCodeWaitForInsert: string = validator.toStr(req.body["code"], "invalid code");
    const pythonFileName: string = validator.toStr(req.body["fileName"], "invalid fileName");

    if (validator.hasErrors()) {
      res.json(new BadRequestResponse(validator.errors));
      return;
    }

    try {
      await ImageComposeService.saveClientOwnPythonCode(pythonCodeWaitForInsert, pythonFileName);
    } catch (err) {
      if (err.message === "FILE_NAME_EXIST") {
        res.json(new ErrorResponse("FILE_NAME_EXIST", 501));
      } else if (err.message === "TEMPLATE_FILE_NO_EXIST") {
        res.json(new ErrorResponse("TEMPLATE_FILE_NO_EXIST", 501));
      } else if (err.message === "SAVE_FAIL") {
        res.json(new ErrorResponse("SAVE_FAIL", 501));
      } else {
        next(err);
      }
    }
  }
}