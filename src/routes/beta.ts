// Copyright 2017 huteng (huteng@gagogroup.com). All rights reserved.,
// Use of this source code is governed a license that can be found in the LICENSE file.

/**
 * This file describes routes in beta version (aka "/api/beta").
 */

import * as express from "express";
import * as timeout from "connect-timeout";
import * as bodyParser from "body-parser";
import * as multer from "multer";

import {corsAllowAll, haltOnTimedout, BadRequestResponse, ApiError, ErrorResponse} from "sakura-node";

import {errorHandler} from "../middleware/errorhandler";
import {ImageComposeController} from "../imagecompose/imagecomposecontroller";


const betaRouter: express.Router = express.Router();

// -------------------------------------------------------------------------
// Middleware (before request)
// -------------------------------------------------------------------------

betaRouter.use(timeout("30s"));
betaRouter.use(haltOnTimedout);
betaRouter.use(corsAllowAll());
betaRouter.use(haltOnTimedout);
betaRouter.use(bodyParser.json()); // for parsing application/json
betaRouter.use(haltOnTimedout);
betaRouter.use((error: Error, req: express.Request, res: express.Response, next: express.NextFunction) => { // invalid JSON
  if (error) {
    res.json(new BadRequestResponse([new ApiError("Invalid JSON", error.message)]));
  }
});
betaRouter.use(haltOnTimedout);
betaRouter.use(bodyParser.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded
betaRouter.use(haltOnTimedout);

// -------------------------------------------------------------------------
// image-browser-awa beta api  (before request)
// -------------------------------------------------------------------------

betaRouter.get("/image/upload_dynamic_code_temp", ImageComposeController.getComposeMapImage);
betaRouter.post("/image/calculate_by_dynamic_code", ImageComposeController.addImageComposeCodeFromClient);
betaRouter.post("/image/save_code", ImageComposeController.saveClientOwnPythonCode);
betaRouter.post("/image/saving_compose_picture", ImageComposeController.uploadComposeImageToSynchronizeToAzure);

// -------------------------------------------------------------------------
// 404
// -------------------------------------------------------------------------

betaRouter.all("/*", (req: express.Request, res: express.Response) => {
  let errorResponse: ErrorResponse = new ErrorResponse("API_NOT_FOUND", 404);
  res.json(errorResponse);
});

// -------------------------------------------------------------------------
// Middleware (after request)
// -------------------------------------------------------------------------

betaRouter.use(errorHandler());

module.exports = betaRouter;