import { IAdapter, IQueryFilters, IPersistable } from './interfaces';


type Constructor<T = {}> = new (...args: any[]) => T;

/**
 * Mixin to add persistence capabilities to a class
 * @param Base The base class to extend
 * @param adapter The storage adapter to use
 * @param collectionName The name of the collection/table
 */
export function PersistableMixin<TBase extends Constructor>(
    Base: TBase,
    adapter: IAdapter,
    collectionName: string
) {
    return class Persistable extends Base implements IPersistable {
        // Add id property if it doesn't exist on Base
        id: string = '';

        constructor(...args: any[]) {
            super(...args);
        }

        async save(): Promise<this> {
            // Check if the base instance has a serialize method
            let data: any;
            if (typeof (this as any).serialize === 'function') {
                data = (this as any).serialize();
            } else {
                // Fallback to simple object clone if no serialize method
                // This might need refinement depending on the complexity of Base objects
                data = JSON.parse(JSON.stringify(this));
            }

            const savedId = await adapter.save(collectionName, this.id || null, data);
            this.id = savedId;
            return this;
        }

        async delete(): Promise<void> {
            if (this.id) {
                await adapter.delete(collectionName, this.id);
            }
        }

        static async findById(id: string): Promise<InstanceType<TBase> & IPersistable | null> {
            const data = await adapter.get(collectionName, id);
            if (!data) return null;

            let instance: any;

            // Use static factory if available (preferred)
            if (typeof (this as any).fromData === 'function') {
                instance = await (this as any).fromData(data);
            } else {
                // Fallback to prototype creation + hydrate/assign
                instance = Object.create(this.prototype);
                if (typeof instance.hydrate === 'function') {
                    await instance.hydrate(data);
                } else {
                    Object.assign(instance, data);
                }
            }

            instance.id = id;
            return instance as InstanceType<TBase> & IPersistable;
        }

        static async findAll(filters?: IQueryFilters): Promise<(InstanceType<TBase> & IPersistable)[]> {
            const datas = await adapter.query(collectionName, filters);

            return Promise.all(datas.map(async data => {
                let instance: any;

                if (typeof (this as any).fromData === 'function') {
                    instance = await (this as any).fromData(data);
                } else {
                    instance = Object.create(this.prototype);
                    if (typeof instance.hydrate === 'function') {
                        await instance.hydrate(data);
                    } else {
                        Object.assign(instance, data);
                    }
                }

                instance.id = data.id;
                return instance as InstanceType<TBase> & IPersistable;
            }));
        }

        static async deleteMany(filters: IQueryFilters): Promise<number> {
            return adapter.deleteMany(collectionName, filters);
        }

        static async updateMany(filters: IQueryFilters, data: any): Promise<number> {
            return adapter.updateMany(collectionName, filters, data);
        }

        static get collectionName() {
            return collectionName;
        }
    };
}
