// Copyright 2021 99cloud
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import client from 'client';
import Base from 'stores/base';

export class ShareInstanceStore extends Base {
  get client() {
    return client.manila.shareInstances;
  }

  get paramsFunc() {
    return (params) => params;
  }

  async detailDidFetch(item) {
    const { id } = item || {};
    const { export_locations = [] } = await this.client.exportLocations.list(
      id
    );
    item.exportLocations = export_locations;
    return item;
  }
}

const globalShareInstanceStore = new ShareInstanceStore();
export default globalShareInstanceStore;