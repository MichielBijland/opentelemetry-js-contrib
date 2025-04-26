/*
 * Copyright The OpenTelemetry Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { ResourceDetector, DetectedResource } from '@opentelemetry/resources';
import {
  CONTAINER_APP_NAME,
  CONTAINER_APP_JOB_NAME,
  CONTAINER_APP_JOB_EXECUTION_NAME,
  CONTAINER_APP_REPLICA_NAME,
  CONTAINER_APP_REVISION,
  CONTAINER_APP_ENV_DNS_SUFFIX,
} from '../types';
import {
  getAzureContainerAppsNamespace,
  getAzureRegion,
  isAzureContainerApps,
  isAzureContainerAppsJob,
} from '../utils';
import {
  ATTR_CLOUD_PLATFORM,
  ATTR_CLOUD_PROVIDER,
  ATTR_CLOUD_REGION,
  ATTR_SERVICE_INSTANCE_ID,
  ATTR_SERVICE_NAME,
  ATTR_SERVICE_NAMESPACE,
  CLOUD_PLATFORM_VALUE_AZURE_CONTAINER_APPS,
  CLOUD_PROVIDER_VALUE_AZURE,
} from '../semconv';
import {
  ATTR_SERVICE_VERSION,
  ATTR_URL_FULL,
} from '@opentelemetry/semantic-conventions';

const CONTAINER_APP_ATTRIBUTE_ENV_VARS = {
  [ATTR_SERVICE_NAME]: CONTAINER_APP_NAME,
  [ATTR_SERVICE_INSTANCE_ID]: CONTAINER_APP_REPLICA_NAME,
  [ATTR_SERVICE_VERSION]: CONTAINER_APP_REVISION,
};

// NOTE: currently we can't garantee that service.namespace,service.name,service.instance.id triplet is globally unique
//       because the namespace is not available in the environment variables
const CONTAINER_APP_JOB_ATTRIBUTE_ENV_VARS = {
  [ATTR_SERVICE_NAME]: CONTAINER_APP_JOB_NAME,
  [ATTR_SERVICE_INSTANCE_ID]: CONTAINER_APP_JOB_EXECUTION_NAME,
};

/**
 * The AzureContainerAppsDetector can be used to detect if a process is running in an Azure Container Apps
 * @returns a {@link Resource} populated with data about the environment or an empty Resource if detection fails.
 */
class AzureContainerAppsDetector implements ResourceDetector {
  detect(): DetectedResource {
    let attributes = {};

    if (isAzureContainerApps() || isAzureContainerAppsJob()) {
      attributes = {
        ...attributes,
        [ATTR_CLOUD_PROVIDER]: CLOUD_PROVIDER_VALUE_AZURE,
      };
      attributes = {
        ...attributes,
        [ATTR_CLOUD_PLATFORM]: CLOUD_PLATFORM_VALUE_AZURE_CONTAINER_APPS,
      };

      // calculated attributes
      if (isAzureContainerApps()) {
        attributes = {
          ...attributes,
          ...{
            [ATTR_URL_FULL]: `https://${process.env[CONTAINER_APP_NAME]}.${process.env[CONTAINER_APP_ENV_DNS_SUFFIX]}`,
          },
        };

        const azureRegion = getAzureRegion();
        if (azureRegion) {
          attributes = {
            ...attributes,
            ...{ [ATTR_CLOUD_REGION]: azureRegion },
          };
        }

        const namespace = getAzureContainerAppsNamespace();
        if (namespace) {
          attributes = {
            ...attributes,
            ...{ [ATTR_SERVICE_NAMESPACE]: namespace },
          };
        }
      }

      // environment variables
      for (const [key, value] of Object.entries(
        isAzureContainerApps()
          ? CONTAINER_APP_ATTRIBUTE_ENV_VARS
          : CONTAINER_APP_JOB_ATTRIBUTE_ENV_VARS
      )) {
        const envVar = process.env[value];
        if (envVar) {
          attributes = { ...attributes, ...{ [key]: envVar } };
        }
      }
    }
    return { attributes };
  }
}

export const azureContainerAppsDetector = new AzureContainerAppsDetector();
