/**
 * Interface for objects that can be serialized
 */
export interface ISerializable {
    /**
     * Convert object to a plain JavaScript object suitable for storage
     */
    serialize(): any;

    /**
     * Optional unique identifier
     */
    id?: string;
}
