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

import * as assert from 'assert';
import { azureContainerAppsDetector } from '../../src/detectors/AzureContainerAppsDetector';
import {
  ATTR_CLOUD_PLATFORM,
  ATTR_CLOUD_PROVIDER,
  ATTR_CLOUD_REGION,
  ATTR_SERVICE_INSTANCE_ID,
  ATTR_SERVICE_NAME,
  ATTR_SERVICE_NAMESPACE,
} from '../../src/semconv';
import {
  ATTR_SERVICE_VERSION,
  ATTR_URL_FULL,
} from '@opentelemetry/semantic-conventions';
import { azureFunctionsDetector, azureAppServiceDetector } from '../../src';
import { detectResources } from '@opentelemetry/resources';

describe('AzureContainerAppsDetector', () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it('should test on container apps', () => {
    process.env.CONTAINER_APP_NAME = 'test-app-name';
    process.env.CONTAINER_APP_REVISION = 'test-app-name-revision';
    process.env.CONTAINER_APP_HOSTNAME =
      'test-app-name-revision.test-hostname.test-region.azurecontainerapps.io';
    process.env.CONTAINER_APP_ENV_DNS_SUFFIX =
      'test-hostname.test-region.azurecontainerapps.io';
    process.env.CONTAINER_APP_REPLICA_NAME = 'test-app-name-revision-replica';

    const resource = detectResources({
      detectors: [
        azureFunctionsDetector,
        azureAppServiceDetector,
        azureContainerAppsDetector,
      ],
    });
    assert.ok(resource);
    const attributes = resource.attributes;
    assert.strictEqual(attributes[ATTR_SERVICE_NAME], 'test-app-name');
    assert.strictEqual(attributes[ATTR_CLOUD_PROVIDER], 'azure');
    assert.strictEqual(attributes[ATTR_CLOUD_PLATFORM], 'azure_container_apps');
    assert.strictEqual(attributes[ATTR_CLOUD_REGION], 'test-region');
    assert.strictEqual(attributes[ATTR_SERVICE_NAMESPACE], 'test-hostname');
    assert.strictEqual(
      attributes[ATTR_SERVICE_INSTANCE_ID],
      'test-app-name-revision-replica'
    );
    assert.strictEqual(
      attributes[ATTR_SERVICE_VERSION],
      'test-app-name-revision'
    );
    assert.strictEqual(
      attributes[ATTR_URL_FULL],
      'https://test-app-name.test-hostname.test-region.azurecontainerapps.io'
    );
  });

  it('should test on container apps job', () => {
    process.env.CONTAINER_APP_JOB_NAME = 'test-job-name';
    process.env.CONTAINER_APP_JOB_EXECUTION_NAME = 'test-job-name-id';

    const resource = detectResources({
      detectors: [
        azureFunctionsDetector,
        azureAppServiceDetector,
        azureContainerAppsDetector,
      ],
    });
    assert.ok(resource);
    const attributes = resource.attributes;
    assert.strictEqual(attributes[ATTR_SERVICE_NAME], 'test-job-name');
    assert.strictEqual(
      attributes[ATTR_SERVICE_INSTANCE_ID],
      'test-job-name-id'
    );
    assert.strictEqual(attributes[ATTR_CLOUD_PROVIDER], 'azure');
    assert.strictEqual(attributes[ATTR_CLOUD_PLATFORM], 'azure_container_apps');
  });
});
