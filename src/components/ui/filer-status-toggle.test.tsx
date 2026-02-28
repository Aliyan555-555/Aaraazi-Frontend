import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
    FilerStatusToggle,
    type FilerStatus,
} from '@/components/ui/filer-status-toggle';


describe('<FilerStatusToggle /> — rendering', () => {
    it('renders both Filer and Non-Filer options', () => {
        render(<FilerStatusToggle />);
        expect(screen.getByTestId('filer-option')).toBeInTheDocument();
        expect(screen.getByTestId('non-filer-option')).toBeInTheDocument();
    });

    it('defaults to non-filer when no value provided', () => {
        render(<FilerStatusToggle />);
        expect(screen.getByTestId('non-filer-option')).toHaveAttribute('aria-checked', 'true');
        expect(screen.getByTestId('filer-option')).toHaveAttribute('aria-checked', 'false');
    });

    it('reflects filer value when value="filer"', () => {
        render(<FilerStatusToggle value="filer" />);
        expect(screen.getByTestId('filer-option')).toHaveAttribute('aria-checked', 'true');
        expect(screen.getByTestId('non-filer-option')).toHaveAttribute('aria-checked', 'false');
    });

    it('renders the info panel by default', () => {
        render(<FilerStatusToggle />);
        expect(screen.getByTestId('filer-info-panel')).toBeInTheDocument();
    });

    it('hides the info panel when showInfo=false', () => {
        render(<FilerStatusToggle showInfo={false} />);
        expect(screen.queryByTestId('filer-info-panel')).not.toBeInTheDocument();
    });

    it('has role="radiogroup" on the container', () => {
        render(<FilerStatusToggle />);
        expect(screen.getByRole('radiogroup', { name: /Tax Filer Status/i })).toBeInTheDocument();
    });
});

// ============================================================================
// WHT info panel content
// ============================================================================

describe('<FilerStatusToggle /> — WHT info panel', () => {
    it('shows filer WHT rates (1% seller, 2% buyer) when value="filer"', () => {
        render(<FilerStatusToggle value="filer" />);
        const panel = screen.getByTestId('filer-info-panel');
        expect(panel).toHaveTextContent('1%');   // seller WHT
        expect(panel).toHaveTextContent('2%');   // buyer WHT
        expect(panel).toHaveTextContent('Active Taxpayer');
    });

    it('shows non-filer WHT rates (2% seller, 4% buyer) when value="non-filer"', () => {
        render(<FilerStatusToggle value="non-filer" />);
        const panel = screen.getByTestId('filer-info-panel');
        expect(panel).toHaveTextContent('2%');   // seller WHT
        expect(panel).toHaveTextContent('4%');   // buyer WHT
        expect(panel).toHaveTextContent('Non-Active Taxpayer');
    });

    it('shows FBR IRIS advice for non-filers', () => {
        render(<FilerStatusToggle value="non-filer" />);
        expect(screen.getByTestId('filer-info-panel')).toHaveTextContent('FBR IRIS');
    });

    it('does NOT show FBR IRIS advice for filers', () => {
        render(<FilerStatusToggle value="filer" />);
        expect(screen.getByTestId('filer-info-panel')).not.toHaveTextContent('FBR IRIS');
    });
});


describe('<FilerStatusToggle /> — interaction', () => {
    it('calls onChange with "filer" when filer button is clicked', async () => {
        const user = userEvent.setup();
        const onChange = vi.fn() as unknown as (status: FilerStatus) => void;

        render(<FilerStatusToggle value="non-filer" onChange={onChange} />);
        await user.click(screen.getByTestId('filer-option'));

        expect(vi.mocked(onChange)).toHaveBeenCalledOnce();
        expect(vi.mocked(onChange)).toHaveBeenCalledWith('filer');
    });

    it('calls onChange with "non-filer" when non-filer button is clicked', async () => {
        const user = userEvent.setup();
        const onChange = vi.fn() as unknown as (status: FilerStatus) => void;

        render(<FilerStatusToggle value="filer" onChange={onChange} />);
        await user.click(screen.getByTestId('non-filer-option'));

        expect(vi.mocked(onChange)).toHaveBeenCalledOnce();
        expect(vi.mocked(onChange)).toHaveBeenCalledWith('non-filer');
    });

    it('does NOT call onChange when clicking the already-selected option', async () => {
        const user = userEvent.setup();
        const onChange = vi.fn();

        render(<FilerStatusToggle value="filer" onChange={onChange} />);
        await user.click(screen.getByTestId('filer-option'));

        expect(onChange).not.toHaveBeenCalled();
    });

    it('does NOT call onChange when disabled', async () => {
        const user = userEvent.setup();
        const onChange = vi.fn();

        render(<FilerStatusToggle value="non-filer" onChange={onChange} disabled />);
        await user.click(screen.getByTestId('filer-option'));

        expect(onChange).not.toHaveBeenCalled();
    });

    it('both buttons are disabled when disabled=true', () => {
        render(<FilerStatusToggle disabled />);
        expect(screen.getByTestId('filer-option')).toBeDisabled();
        expect(screen.getByTestId('non-filer-option')).toBeDisabled();
    });
});
