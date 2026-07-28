import type * as ContainerMetadata from "#app/Interfaces/Internal/ContainerInterface";

export class ContainerMetadataClass implements ContainerMetadata.ContainerMetadataInterface {

    public name: string = "example";

    public target: new () => unknown = ContainerMetadataClass;

}
