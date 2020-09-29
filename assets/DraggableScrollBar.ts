// Learn TypeScript:
//  - [Chinese] https://docs.cocos.com/creator/manual/zh/scripting/typescript.html
//  - [English] http://www.cocos2d-x.org/docs/creator/manual/en/scripting/typescript.html
// Learn Attribute:
//  - [Chinese] https://docs.cocos.com/creator/manual/zh/scripting/reference/attributes.html
//  - [English] http://www.cocos2d-x.org/docs/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - [Chinese] https://docs.cocos.com/creator/manual/zh/scripting/life-cycle-callbacks.html
//  - [English] http://www.cocos2d-x.org/docs/creator/manual/en/scripting/life-cycle-callbacks.html

const { ccclass, property } = cc._decorator;

@ccclass
export default class DraggableScrollBar extends cc.Component {

    @property(cc.Scrollbar)
    scrollBarComponent: cc.Scrollbar = null;

    @property(cc.ScrollView)
    scrollViewComponent: cc.ScrollView = null;

    private isDragging: boolean = false;
    private cachedScrollView: any = null;


    start() {
        this.registerEvents();
    }

    private registerEvents() {
        this.node.on(cc.Node.EventType.TOUCH_START, (event) => {
            this.isDragging = true;
            this.onTouchStart(event);
        });
        this.node.on(cc.Node.EventType.TOUCH_END, (event) => {
            this.onTouchEnd(event);
        });
        this.node.on(cc.Node.EventType.TOUCH_CANCEL, (event) => {
            this.onTouchEnd(event);
        });
        this.node.on(cc.Node.EventType.TOUCH_MOVE, (event) => {
            this.onTouchMove(event)
        });
    }

    private onTouchStart(event) {
        this.cachedScrollView = (<any>this.scrollBarComponent)._scrollView;
        (<any>this.scrollBarComponent)._scrollView = undefined;
    }

    private onTouchEnd(event) {
        (<any>this.scrollBarComponent)._scrollView = this.cachedScrollView;
        this.OnReset();
    }

    private OnReset() {
        this.isDragging = false;
    }

    private onTouchMove(event) {
        if (!this.isDragging) {
            return;
        }

        var delta = event.touch.getDelta();
        if (this.canMoveHandleWithAmount(delta)) {
            if (this.scrollBarComponent.direction == cc.Scrollbar.Direction.HORIZONTAL) {
                this.scrollBarComponent.handle.node.x += delta.x;
            } else {
                this.scrollBarComponent.handle.node.y += delta.y;
            }
            this.updateScrollViewContentPosition(delta);
        }
        event.stopPropagation();
    }

    private updateScrollViewContentPosition(delta: cc.Vec2) {
        var content = this.scrollViewComponent.content;
        if (content) {
            var contentSize = content.getContentSize();
            var scrollViewSize = this.scrollViewComponent.node.getContentSize();
            var handleNodeSize = this.scrollBarComponent.node.getContentSize();

            var contentMeasure = 0;
            var scrollViewMeasure = 0;
            var contentPosition = 0;
            var handleNodeMeasure = 0;

            if (this.scrollBarComponent.direction === cc.Scrollbar.Direction.HORIZONTAL) {
                contentMeasure = contentSize.width;
                scrollViewMeasure = scrollViewSize.width;
                handleNodeMeasure = handleNodeSize.width;

                contentPosition = -this.convertToScrollViewSpace(content).x;
            } else if (this.scrollBarComponent.direction === cc.Scrollbar.Direction.VERTICAL) {
                contentMeasure = contentSize.height;
                scrollViewMeasure = scrollViewSize.height;
                handleNodeMeasure = handleNodeSize.height;

                contentPosition = -this.convertToScrollViewSpace(content).y;
            }

            var handleLength = this.getHandleLength();
            var currentHandlePos = this.getCurrentHandlePositionValue();
            var denominatorValue = contentMeasure - scrollViewMeasure;
            var positionRatio = currentHandlePos / (handleNodeMeasure - handleLength);
            positionRatio = cc.misc.clamp01(positionRatio);

            let newPos = cc.v2(0, 0);
            if (this.scrollBarComponent.direction === cc.Scrollbar.Direction.HORIZONTAL) {
                this.scrollViewComponent.scrollToPercentHorizontal(positionRatio);
            } else {
                this.scrollViewComponent.scrollToPercentVertical(positionRatio);
            }

        }
    }

    private canMoveHandleWithAmount(delta: cc.Vec2): boolean {
        let handleBB = this.scrollBarComponent.handle.node.getBoundingBoxToWorld();
        let barBB = this.node.getBoundingBoxToWorld();

        var leftBottomWorldPosition = cc.v2(barBB.xMin, barBB.yMin);
        var rightTopWorldPosition = cc.v2(barBB.xMax, barBB.yMax);
        if (this.scrollBarComponent.direction === cc.Scrollbar.Direction.HORIZONTAL) {
            return handleBB.xMin + delta.x >= leftBottomWorldPosition.x && handleBB.xMax + delta.x <= rightTopWorldPosition.x;
        } else {
            return handleBB.yMin + delta.y >= leftBottomWorldPosition.y && handleBB.yMax + delta.y <= rightTopWorldPosition.y;
        }
    }

    private getCurrentHandlePositionValue(): number {
        var baseHandlePosition = this.getBaseHandlePosition();
        if (this.scrollBarComponent.direction == cc.Scrollbar.Direction.HORIZONTAL) {
            return this.scrollBarComponent.handle.node.x - baseHandlePosition.x;
        } else {
            return this.scrollBarComponent.handle.node.y - baseHandlePosition.y;
        }
    }

    private getBaseHandlePosition(): cc.Vec2 {
        var barSize = this.node.getContentSize();
        var barAnchor = this.node.getAnchorPoint();
        var handleSize = this.scrollBarComponent.handle.node.getContentSize();

        var handleParent = this.scrollBarComponent.handle.node.parent;

        var leftBottomWorldPosition = this.node.convertToWorldSpaceAR(cc.v2(-barSize.width * barAnchor.x, -barSize.height * barAnchor.y));
        var basePosition = handleParent.convertToNodeSpaceAR(leftBottomWorldPosition);

        if (this.scrollBarComponent.direction === cc.Scrollbar.Direction.HORIZONTAL) {
            basePosition = cc.v2(basePosition.x, basePosition.y + (barSize.height - handleSize.height) / 2);
        } else if (this.scrollBarComponent.direction === cc.Scrollbar.Direction.VERTICAL) {
            basePosition = cc.v2(basePosition.x + (barSize.width - handleSize.width) / 2, basePosition.y);
        }

        return basePosition;
    }

    private convertToScrollViewSpace(content): cc.Vec2 {
        let scrollViewNode = this.scrollViewComponent.node;
        var worldSpacePos = content.convertToWorldSpaceAR(cc.v2(-content.anchorX * content.width, -content.anchorY * content.height));
        var scrollViewSpacePos = scrollViewNode.convertToNodeSpaceAR(worldSpacePos);
        scrollViewSpacePos.x += scrollViewNode.anchorX * scrollViewNode.width;
        scrollViewSpacePos.y += scrollViewNode.anchorY * scrollViewNode.height;
        return scrollViewSpacePos;
    }

    private getHandleLength(): number {
        let size = this.scrollBarComponent.handle.node.getContentSize();
        if (this.scrollBarComponent.direction == cc.Scrollbar.Direction.HORIZONTAL) {
            return size.width;
        } else {
            return size.height;
        }
    }

}
