// components/CustomNodeLabel.tsx
import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faInfoCircle } from '@fortawesome/free-solid-svg-icons';

interface CustomNodeLabelProps {
    nodeData: any;
    handleInfoClick: (nodeData: any) => void;
    handleCheckboxChange?: (nodeData: any, checked: boolean) => void;
    isChecked?: boolean;
    showCheckbox?: boolean;
    handleNodeClick: () => void;
}

const CustomNodeLabel: React.FC<CustomNodeLabelProps> = ({
                                                             nodeData,
                                                             handleInfoClick,
                                                             handleCheckboxChange,
                                                             isChecked,
                                                             showCheckbox,
                                                             handleNodeClick,
                                                         }) => {
    const [tooltipVisible, setTooltipVisible] = useState<boolean>(false);

    const handleMouseOver = () => {
        setTooltipVisible(true);
    };

    const handleMouseOut = () => {
        setTooltipVisible(false);
    };

    return (
        <div
            style={{
                display: 'flex',
                alignItems: 'center',
                position: 'relative',
            }}
            onClick={handleNodeClick}
        >
            {showCheckbox && (
                <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={(e) => handleCheckboxChange?.(nodeData, e.target.checked)}
                    onClick={(e) => e.stopPropagation()}
                    style={{ marginRight: 5 }}
                />
            )}
            <span>{nodeData.name}</span>
            <div
                style={{ marginLeft: 5, cursor: 'pointer' }}
                onMouseOver={handleMouseOver}
                onMouseOut={handleMouseOut}
                onClick={(e) => {
                    e.stopPropagation();
                    handleInfoClick(nodeData);
                }}
            >
                <FontAwesomeIcon icon={faInfoCircle} className="text-blue-500" />
            </div>
            {tooltipVisible && (
                <div
                    style={{
                        position: 'absolute',
                        top: -35,
                        left: 0,
                        backgroundColor: 'rgba(0, 0, 0, 0.75)',
                        color: 'white',
                        padding: '5px 10px',
                        borderRadius: '4px',
                        whiteSpace: 'nowrap',
                        zIndex: 1000,
                    }}
                >
                    {nodeData.attributes.description || 'No description'}
                </div>
            )}
        </div>
    );
};

export default CustomNodeLabel;
