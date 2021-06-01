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

import { getGBValue } from 'utils/index';
import { novaBase, placementBase } from 'utils/constants';
import { action, observable } from 'mobx';
import { get } from 'lodash';
import Base from '../base';

export class HypervisorStore extends Base {
  get module() {
    return 'os-hypervisors';
  }

  get apiVersion() {
    return novaBase();
  }

  get responseKey() {
    return 'hypervisor';
  }

  @observable
  overview = {};

  // get mapper() {
  //   return (item) => {
  //     item.vcpus_used_percent = ((item.vcpus_used / item.vcpus) * 100).toFixed(2);
  //     item.memory_mb_percent = ((item.memory_mb_used / item.memory_mb) * 100).toFixed(2);
  //     item.storage_percent = ((item.local_gb_used / item.local_gb) * 100).toFixed(2);
  //     item.memory_mb_used_gb = getGBValue(item.memory_mb_used);
  //     item.memory_mb_gb = getGBValue(item.memory_mb);
  //     return item;
  //   };
  // }

  async listDidFetch(items, all_projects, filters) {
    const { simple } = filters;
    if (simple) {
      return items;
    }
    const requestList = items.map((it) =>
      request.get(`${placementBase()}/resource_providers/${it.id}/inventories`)
    );
    const inventories = await Promise.all(requestList);
    const result = items.map((item, index) => {
      if (item.hypervisor_type !== 'ironic') {
        const {
          inventories: {
            VCPU: { allocation_ratio },
            MEMORY_MB: { allocation_ratio: memory_ratio },
          },
        } = inventories[index];
        item.vcpus *= allocation_ratio;
        item.memory_mb *= memory_ratio;
      }
      item.vcpus_used_percent =
        (item.vcpus && ((item.vcpus_used / item.vcpus) * 100).toFixed(2)) || 0;
      item.memory_mb_percent =
        (item.memory_mb &&
          ((item.memory_mb_used / item.memory_mb) * 100).toFixed(2)) ||
        0;
      item.storage_percent =
        (item.local_gb &&
          ((item.local_gb_used / item.local_gb) * 100).toFixed(2)) ||
        0;
      item.memory_mb_used_gb = getGBValue(item.memory_mb_used);
      item.memory_mb_gb = getGBValue(item.memory_mb);
      return item;
    });
    return result;
  }

  getListDetailUrl = () => `${this.apiVersion}/${this.module}/detail`;

  @action
  async fetchDetail({ id, all_projects }) {
    this.isLoading = true;
    const result = await request.get(this.getDetailUrl({ id }));
    const originData = get(result, this.responseKey) || result;
    const item = this.mapperBeforeFetchProject(originData);
    const inventoriesReuslt = await request.get(
      `${placementBase()}/resource_providers/${item.id}/inventories`
    );
    if (item.hypervisor_type !== 'ironic') {
      const {
        inventories: {
          VCPU: { allocation_ratio },
          MEMORY_MB: { allocation_ratio: memory_ratio },
        },
      } = inventoriesReuslt;
      item.vcpus *= allocation_ratio;
      item.memory_mb *= memory_ratio;
    }
    const newItem = await this.detailDidFetch(item, all_projects);
    const detail = this.mapper(newItem);
    this.detail = detail;
    this.isLoading = false;
    return detail;
  }

  @action
  getOverview = async () => {
    this.isLoading = true;
    const url = this.getListDetailUrl();
    const hypervisorResult = await request.get(url);
    const { hypervisors } = hypervisorResult;
    const data = {
      vcpus: 0,
      vcpus_used: 0,
      memory_mb: 0,
      memory_mb_used: 0,
      local_gb: 0,
      local_gb_used: 0,
    };
    const requestList = hypervisors.map((it) =>
      request.get(`${placementBase()}/resource_providers/${it.id}/inventories`)
    );
    const inventories = await Promise.all(requestList);
    hypervisors.forEach((item, index) => {
      if (item.hypervisor_type !== 'ironic') {
        const {
          inventories: {
            VCPU: { allocation_ratio },
            MEMORY_MB: { allocation_ratio: memory_ratio },
          },
        } = inventories[index];
        item.vcpus *= allocation_ratio;
        item.memory_mb *= memory_ratio;
      }
      data.vcpus += item.vcpus;
      data.vcpus_used += item.vcpus_used;
      data.memory_mb += getGBValue(item.memory_mb);
      data.memory_mb_used += getGBValue(item.memory_mb_used);
      // fetch storage info from prometheus
      // data.local_gb += item.local_gb;
      // data.local_gb_used += item.local_gb_used;
      // fetch storage info from prometheus
    });
    this.overview = data;
    this.isLoading = false;
  };
}

const globalHypervisorStore = new HypervisorStore();
export default globalHypervisorStore;