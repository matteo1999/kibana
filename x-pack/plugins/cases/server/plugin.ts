/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { IContextProvider, KibanaRequest, Logger, PluginInitializerContext } from 'kibana/server';
import { CoreSetup, CoreStart } from 'src/core/server';

import { UsageCollectionSetup } from '../../../../src/plugins/usage_collection/server';
import { SecurityPluginSetup, SecurityPluginStart } from '../../security/server';
import {
  PluginSetupContract as ActionsPluginSetup,
  PluginStartContract as ActionsPluginStart,
} from '../../actions/server';
import { APP_ID } from '../common/constants';

import {
  createCaseCommentSavedObjectType,
  caseConfigureSavedObjectType,
  caseConnectorMappingsSavedObjectType,
  createCaseSavedObjectType,
  caseUserActionSavedObjectType,
} from './saved_object_types';

import { CasesClient } from './client';
import type { CasesRequestHandlerContext } from './types';
import { CasesClientFactory } from './client/factory';
import { SpacesPluginStart } from '../../spaces/server';
import { PluginStartContract as FeaturesPluginStart } from '../../features/server';
import { LensServerPluginSetup } from '../../lens/server';
import { registerRoutes } from './routes/api/register_routes';
import { getExternalRoutes } from './routes/api/get_external_routes';

export interface PluginsSetup {
  actions: ActionsPluginSetup;
  lens: LensServerPluginSetup;
  usageCollection?: UsageCollectionSetup;
  security?: SecurityPluginSetup;
}

export interface PluginsStart {
  security?: SecurityPluginStart;
  features: FeaturesPluginStart;
  spaces?: SpacesPluginStart;
  actions: ActionsPluginStart;
}

/**
 * Cases server exposed contract for interacting with cases entities.
 */
export interface PluginStartContract {
  /**
   * Returns a client which can be used to interact with the cases backend entities.
   *
   * @param request a KibanaRequest
   * @returns a {@link CasesClient}
   */
  getCasesClientWithRequest(request: KibanaRequest): Promise<CasesClient>;
}

export class CasePlugin {
  private readonly log: Logger;
  private readonly kibanaVersion: PluginInitializerContext['env']['packageInfo']['version'];
  private clientFactory: CasesClientFactory;
  private securityPluginSetup?: SecurityPluginSetup;
  private lensEmbeddableFactory?: LensServerPluginSetup['lensEmbeddableFactory'];

  constructor(private readonly initializerContext: PluginInitializerContext) {
    this.kibanaVersion = initializerContext.env.packageInfo.version;
    this.log = this.initializerContext.logger.get();
    this.clientFactory = new CasesClientFactory(this.log);
  }

  public setup(core: CoreSetup, plugins: PluginsSetup) {
    this.securityPluginSetup = plugins.security;
    this.lensEmbeddableFactory = plugins.lens.lensEmbeddableFactory;

    core.savedObjects.registerType(
      createCaseCommentSavedObjectType({
        migrationDeps: {
          lensEmbeddableFactory: this.lensEmbeddableFactory,
        },
      })
    );
    core.savedObjects.registerType(caseConfigureSavedObjectType);
    core.savedObjects.registerType(caseConnectorMappingsSavedObjectType);
    core.savedObjects.registerType(createCaseSavedObjectType(core, this.log));
    core.savedObjects.registerType(caseUserActionSavedObjectType);

    this.log.debug(
      `Setting up Case Workflow with core contract [${Object.keys(
        core
      )}] and plugins [${Object.keys(plugins)}]`
    );

    core.http.registerRouteHandlerContext<CasesRequestHandlerContext, 'cases'>(
      APP_ID,
      this.createRouteHandlerContext({
        core,
      })
    );

    const router = core.http.createRouter<CasesRequestHandlerContext>();
    const telemetryUsageCounter = plugins.usageCollection?.createUsageCounter(APP_ID);

    registerRoutes({
      router,
      routes: getExternalRoutes(),
      logger: this.log,
      kibanaVersion: this.kibanaVersion,
      telemetryUsageCounter,
    });
  }

  public start(core: CoreStart, plugins: PluginsStart): PluginStartContract {
    this.log.debug(`Starting Case Workflow`);

    this.clientFactory.initialize({
      securityPluginSetup: this.securityPluginSetup,
      securityPluginStart: plugins.security,
      getSpace: async (request: KibanaRequest) => {
        return plugins.spaces?.spacesService.getActiveSpace(request);
      },
      featuresPluginStart: plugins.features,
      actionsPluginStart: plugins.actions,
      /**
       * Lens will be always defined as
       * it is declared as required plugin in kibana.json
       */
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      lensEmbeddableFactory: this.lensEmbeddableFactory!,
    });

    const client = core.elasticsearch.client;

    const getCasesClientWithRequest = async (request: KibanaRequest): Promise<CasesClient> => {
      return this.clientFactory.create({
        request,
        scopedClusterClient: client.asScoped(request).asCurrentUser,
        savedObjectsService: core.savedObjects,
      });
    };

    return {
      getCasesClientWithRequest,
    };
  }

  public stop() {
    this.log.debug(`Stopping Case Workflow`);
  }

  private createRouteHandlerContext = ({
    core,
  }: {
    core: CoreSetup;
  }): IContextProvider<CasesRequestHandlerContext, 'cases'> => {
    return async (context, request, response) => {
      return {
        getCasesClient: async () => {
          const [{ savedObjects }] = await core.getStartServices();

          return this.clientFactory.create({
            request,
            scopedClusterClient: context.core.elasticsearch.client.asCurrentUser,
            savedObjectsService: savedObjects,
          });
        },
      };
    };
  };
}
