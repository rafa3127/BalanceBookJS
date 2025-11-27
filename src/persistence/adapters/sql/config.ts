import { Knex } from 'knex';

export interface SQLConfig extends Knex.Config {
    // We can extend Knex config if needed, but for now it's sufficient
}
