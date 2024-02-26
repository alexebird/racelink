<template>
  <div class="top-level-nav">
    <Menu :model="items" class="top-level-nav">
      <template #item="{ item, props }">
        <router-link v-if="item.route" v-slot="{ href, navigate }" :to="item.route" custom>
          <a :href="href" v-bind="props.action" @click="navigate">
            <span :class="item.icon" />
              <span class="ml-2">{{ item.label }}</span>
          </a>
        </router-link>
      </template>
    </Menu>
  </div>
</template>

<script lang='ts'>
import { defineComponent } from 'vue';
import Menu from 'primevue/menu';

export default defineComponent({
  components: {
    Menu,
  },
  data() {
    return {
      items: [
        {
            label: 'Rally',
            icon: 'pi pi-palette',
            route: '/rally'
        },
        {
            label: 'Rally2',
            icon: 'pi pi-palette',
            route: '/rally2'
        }
      ],
    };
  },
});
</script>

<style scoped>
.top-level-nav {
  display: flex;
  flex-direction: column;
  width: 200px;
}
</style>
