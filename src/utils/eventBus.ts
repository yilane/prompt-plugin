import mitt from 'mitt'

type Events = {
  'favorite:toggle': { id: string; isFavorite: boolean };
};

const emitter = mitt<Events>()

export default emitter 