export default function ImageComponent(props: any) {
    
    return (
        <img src={props.imageURL} className={props.cssClass}></img>
    )
}